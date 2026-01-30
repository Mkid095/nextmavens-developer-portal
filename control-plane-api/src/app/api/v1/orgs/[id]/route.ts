import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateOrganizationSchema } from '@/lib/validation'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate organization ownership
async function validateOrganizationOwnership(
  orgId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; organization?: any }> {
  const pool = getPool()
  const result = await pool.query(
    `SELECT o.id, o.name, o.slug, o.owner_id, o.created_at,
            om.role as user_role
     FROM control_plane.organizations o
     LEFT JOIN control_plane.organization_members om ON om.org_id = o.id AND om.user_id = $2
     WHERE o.id = $1`,
    [orgId, developer.id]
  )

  if (result.rows.length === 0) {
    return { valid: false }
  }

  const organization = result.rows[0]

  // Check if user is owner or has admin role
  const isOwner = organization.owner_id === developer.id
  const isAdmin = organization.user_role === 'admin' || organization.user_role === 'owner'

  if (!isOwner && !isAdmin) {
    return { valid: false, organization }
  }

  return { valid: true, organization }
}

// GET /v1/orgs/:id - Get organization details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Get organization with membership details
    const orgResult = await pool.query(
      `SELECT o.id, o.name, o.slug, o.owner_id, o.created_at,
              CASE WHEN o.owner_id = $2 THEN 'owner' ELSE om.role END as user_role
       FROM control_plane.organizations o
       LEFT JOIN control_plane.organization_members om ON om.org_id = o.id AND om.user_id = $2
       WHERE o.id = $1`,
      [params.id, developer.id]
    )

    if (orgResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const organization = orgResult.rows[0]

    // Check if user has access to this organization
    if (!organization.user_role) {
      return errorResponse('FORBIDDEN', 'You do not have access to this organization', 403)
    }

    // Get members
    const membersResult = await pool.query(
      `SELECT om.user_id, om.role, om.invited_by, om.joined_at, om.created_at,
              d.name as user_name, d.email as user_email
       FROM control_plane.organization_members om
       JOIN developers d ON d.id = om.user_id
       WHERE om.org_id = $1
       ORDER BY om.joined_at ASC`,
      [params.id]
    )

    return NextResponse.json({
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        owner_id: organization.owner_id,
        user_role: organization.user_role,
        created_at: organization.created_at,
        members: membersResult.rows.map(m => ({
          user_id: m.user_id,
          name: m.user_name,
          email: m.user_email,
          role: m.role,
          invited_by: m.invited_by,
          joined_at: m.joined_at,
        })),
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting organization:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get organization', 500)
  }
}

// PUT /v1/orgs/:id - Update organization
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: any
    try {
      validatedData = updateOrganizationSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Check ownership
    const ownershipCheck = await validateOrganizationOwnership(params.id, developer)
    if (!ownershipCheck.valid) {
      if (ownershipCheck.organization) {
        return errorResponse('FORBIDDEN', 'Only owners can update organizations', 403)
      }
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const pool = getPool()

    // Build update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validatedData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(validatedData.name)

      // Update slug as well
      const slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      updates.push(`slug = $${paramIndex++}`)
      values.push(slug)
    }

    if (updates.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400)
    }

    values.push(params.id)

    const result = await pool.query(
      `UPDATE control_plane.organizations
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, slug, owner_id, created_at`,
      values
    )

    const organization = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        owner_id: organization.owner_id,
        created_at: organization.created_at,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error updating organization:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update organization', 500)
  }
}
