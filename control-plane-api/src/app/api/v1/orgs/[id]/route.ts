import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateOrganizationSchema, type UpdateOrganizationInput } from '@/lib/validation'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate organization ownership/admin access
async function validateOrganizationAccess(
  orgId: string,
  developer: JwtPayload,
  requireAdmin: boolean = false
): Promise<{ valid: boolean; organization?: any; member?: any }> {
  const pool = getPool()

  // Check if user is a member of the organization
  const memberResult = await pool.query(
    `SELECT om.id, om.org_id, om.user_id, om.role, om.status,
            o.name, o.slug, o.owner_id
     FROM control_plane.organization_members om
     JOIN control_plane.organizations o ON o.id = om.org_id
     WHERE om.org_id = $1 AND om.user_id = $2`,
    [orgId, developer.id]
  )

  if (memberResult.rows.length === 0) {
    return { valid: false }
  }

  const member = memberResult.rows[0]
  const organization = {
    id: memberResult.rows[0].org_id,
    name: memberResult.rows[0].name,
    slug: memberResult.rows[0].slug,
    owner_id: memberResult.rows[0].owner_id,
  }

  // Check membership status
  if (member.status !== 'accepted') {
    return { valid: false }
  }

  // If admin access is required, check role
  if (requireAdmin && member.role !== 'owner' && member.role !== 'admin') {
    return { valid: false, organization, member }
  }

  return { valid: true, organization, member }
}

// GET /v1/orgs/:id - Get organization details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const orgId = params.id

    // Validate organization access (viewer or higher)
    const accessCheck = await validateOrganizationAccess(orgId, developer, false)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You do not have access to this organization', 403)
    }

    // Get organization details
    const orgResult = await pool.query(
      `SELECT
        o.id, o.name, o.slug, o.owner_id, o.settings, o.created_at, o.updated_at,
        COUNT(om.id) as member_count
      FROM control_plane.organizations o
      LEFT JOIN control_plane.organization_members om ON om.org_id = o.id AND om.status = 'accepted'
      WHERE o.id = $1 AND o.deleted_at IS NULL
      GROUP BY o.id, o.name, o.slug, o.owner_id, o.settings, o.created_at, o.updated_at`,
      [orgId]
    )

    if (orgResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const organization = orgResult.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        owner_id: organization.owner_id,
        settings: organization.settings,
        member_count: parseInt(organization.member_count),
        created_at: organization.created_at,
        updated_at: organization.updated_at,
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

// PATCH /v1/orgs/:id - Update organization (admin or owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()
    const pool = getPool()
    const orgId = params.id

    // Validate request body
    let validatedData: UpdateOrganizationInput
    try {
      validatedData = updateOrganizationSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Validate organization access (admin or higher)
    const accessCheck = await validateOrganizationAccess(orgId, developer, true)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You must be an admin or owner to update this organization', 403)
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (validatedData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(validatedData.name)
    }

    if (updates.length === 0) {
      return errorResponse('BAD_REQUEST', 'No fields to update', 400)
    }

    updates.push(`updated_at = NOW()`)
    values.push(orgId)

    // Update organization
    const result = await pool.query(
      `UPDATE control_plane.organizations
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, name, slug, owner_id, settings, created_at, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const organization = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        owner_id: organization.owner_id,
        settings: organization.settings,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
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

// DELETE /v1/orgs/:id - Soft delete organization (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const orgId = params.id

    // Validate organization ownership
    const accessCheck = await validateOrganizationAccess(orgId, developer, true)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You must be the owner to delete this organization', 403)
    }

    // Verify the user is the owner (not just an admin)
    if (accessCheck.member.role !== 'owner') {
      return errorResponse('FORBIDDEN', 'Only the organization owner can delete it', 403)
    }

    // Soft delete the organization
    const result = await pool.query(
      `UPDATE control_plane.organizations
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, slug`,
      [orgId]
    )

    if (result.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        slug: result.rows[0].slug,
        message: 'Organization deleted successfully'
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error deleting organization:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to delete organization', 500)
  }
}
