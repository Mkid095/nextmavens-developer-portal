import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateMemberRoleSchema } from '@/lib/validation'

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

// PUT /v1/orgs/:id/members/:userId - Update member role
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: any
    try {
      validatedData = updateMemberRoleSchema.parse(body)
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

    // Check ownership (only owners can update member roles)
    const ownershipCheck = await validateOrganizationOwnership(params.id, developer)
    if (!ownershipCheck.valid) {
      if (ownershipCheck.organization) {
        return errorResponse('FORBIDDEN', 'Only owners can update member roles', 403)
      }
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const pool = getPool()

    // Get current member data
    const currentMember = await pool.query(
      'SELECT role FROM control_plane.organization_members WHERE org_id = $1 AND user_id = $2',
      [params.id, params.userId]
    )

    if (currentMember.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Member not found', 404)
    }

    // Prevent removing or changing the owner's role
    const orgData = await pool.query(
      'SELECT owner_id FROM control_plane.organizations WHERE id = $1',
      [params.id]
    )

    if (orgData.rows.length > 0 && orgData.rows[0].owner_id === params.userId) {
      return errorResponse('FORBIDDEN', 'Cannot change the role of the organization owner', 403)
    }

    // Update member role
    const result = await pool.query(
      `UPDATE control_plane.organization_members
       SET role = $1
       WHERE org_id = $2 AND user_id = $3
       RETURNING org_id, user_id, role, joined_at, created_at`,
      [validatedData.role, params.id, params.userId]
    )

    const member = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        org_id: member.org_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error updating member role:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update member role', 500)
  }
}

// DELETE /v1/orgs/:id/members/:userId - Remove member from organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const developer = await authenticateRequest(req)

    // Check ownership (only owners can remove members)
    const ownershipCheck = await validateOrganizationOwnership(params.id, developer)
    if (!ownershipCheck.valid) {
      if (ownershipCheck.organization) {
        return errorResponse('FORBIDDEN', 'Only owners can remove members', 403)
      }
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const pool = getPool()

    // Prevent removing the owner
    const orgData = await pool.query(
      'SELECT owner_id FROM control_plane.organizations WHERE id = $1',
      [params.id]
    )

    if (orgData.rows.length > 0 && orgData.rows[0].owner_id === params.userId) {
      return errorResponse('FORBIDDEN', 'Cannot remove the organization owner', 403)
    }

    // Check if member exists
    const existingMember = await pool.query(
      'SELECT user_id FROM control_plane.organization_members WHERE org_id = $1 AND user_id = $2',
      [params.id, params.userId]
    )

    if (existingMember.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Member not found', 404)
    }

    // Remove member
    await pool.query(
      'DELETE FROM control_plane.organization_members WHERE org_id = $1 AND user_id = $2',
      [params.id, params.userId]
    )

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error removing member:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to remove member', 500)
  }
}
