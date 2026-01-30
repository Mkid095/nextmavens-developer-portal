import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { addMemberSchema } from '@/lib/validation'

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

// POST /v1/orgs/:id/members - Add member to organization
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: any
    try {
      validatedData = addMemberSchema.parse(body)
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

    // Check ownership (only owners can add members)
    const ownershipCheck = await validateOrganizationOwnership(params.id, developer)
    if (!ownershipCheck.valid) {
      if (ownershipCheck.organization) {
        return errorResponse('FORBIDDEN', 'Only owners can add members', 403)
      }
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const pool = getPool()

    // Verify the user exists
    const userResult = await pool.query(
      'SELECT id, name, email FROM developers WHERE id = $1',
      [validatedData.user_id]
    )

    if (userResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'User not found', 404)
    }

    // Check if user is already a member
    const existingMember = await pool.query(
      'SELECT user_id FROM control_plane.organization_members WHERE org_id = $1 AND user_id = $2',
      [params.id, validatedData.user_id]
    )

    if (existingMember.rows.length > 0) {
      return errorResponse('DUPLICATE_MEMBER', 'User is already a member of this organization', 409)
    }

    // Add member
    const result = await pool.query(
      `INSERT INTO control_plane.organization_members (org_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       RETURNING org_id, user_id, role, invited_by, joined_at, created_at`,
      [params.id, validatedData.user_id, validatedData.role, developer.id]
    )

    const member = result.rows[0]
    const user = userResult.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        org_id: member.org_id,
        user_id: member.user_id,
        name: user.name,
        email: user.email,
        role: member.role,
        invited_by: member.invited_by,
        joined_at: member.joined_at,
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error adding member:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to add member', 500)
  }
}
