import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { updateMemberRoleSchema, type UpdateMemberRoleInput } from '@/lib/validation'

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

// Helper function to get a specific member by ID
async function getMember(orgId: string, memberId: string) {
  const pool = getPool()
  const result = await pool.query(
    `SELECT id, org_id, user_id, role, status, invited_by, invited_at, accepted_at, created_at, updated_at
     FROM control_plane.organization_members
     WHERE id = $1 AND org_id = $2`,
    [memberId, orgId]
  )
  return result.rows[0] || null
}

// GET /v1/orgs/:id/members/:memberId - Get member details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const orgId = params.id
    const memberId = params.memberId

    // Validate organization access (viewer or higher)
    const accessCheck = await validateOrganizationAccess(orgId, developer, false)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You do not have access to this organization', 403)
    }

    // Get member details
    const member = await getMember(orgId, memberId)

    if (!member) {
      return errorResponse('NOT_FOUND', 'Member not found', 404)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        status: member.status,
        invited_by: member.invited_by,
        invited_at: member.invited_at,
        accepted_at: member.accepted_at,
        created_at: member.created_at,
        updated_at: member.updated_at,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting organization member:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get organization member', 500)
  }
}

// PATCH /v1/orgs/:id/members/:memberId - Update member role (admin or owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()
    const pool = getPool()
    const orgId = params.id
    const memberId = params.memberId

    // Validate organization access (admin or higher)
    const accessCheck = await validateOrganizationAccess(orgId, developer, true)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You must be an admin or owner to update member roles', 403)
    }

    // Get the member to update
    const targetMember = await getMember(orgId, memberId)

    if (!targetMember) {
      return errorResponse('NOT_FOUND', 'Member not found', 404)
    }

    // Validate request body
    let validatedData: UpdateMemberRoleInput
    try {
      validatedData = updateMemberRoleSchema.parse(body)
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

    // Check permissions:
    // - Owner can change any role
    // - Admin can only change developer/viewer roles, not owner/admin
    if (accessCheck.member.role === 'admin') {
      if (targetMember.role === 'owner' || targetMember.role === 'admin') {
        return errorResponse('FORBIDDEN', 'Admins cannot modify other admins or the owner', 403)
      }
      if (validatedData.role === 'owner' || validatedData.role === 'admin') {
        return errorResponse('FORBIDDEN', 'Admins cannot promote to admin or owner', 403)
      }
    }

    // Cannot change your own role
    if (targetMember.user_id === developer.id) {
      return errorResponse('BAD_REQUEST', 'Cannot change your own role', 400)
    }

    // Update member role
    const result = await pool.query(
      `UPDATE control_plane.organization_members
       SET role = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING id, user_id, role, status, invited_by, invited_at, accepted_at, created_at, updated_at`,
      [validatedData.role, memberId, orgId]
    )

    if (result.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Member not found', 404)
    }

    const member = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        status: member.status,
        invited_by: member.invited_by,
        invited_at: member.invited_at,
        accepted_at: member.accepted_at,
        created_at: member.created_at,
        updated_at: member.updated_at,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error updating organization member:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to update organization member', 500)
  }
}

// DELETE /v1/orgs/:id/members/:memberId - Remove member (admin or owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const orgId = params.id
    const memberId = params.memberId

    // Validate organization access (admin or higher)
    const accessCheck = await validateOrganizationAccess(orgId, developer, true)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You must be an admin or owner to remove members', 403)
    }

    // Get the member to remove
    const targetMember = await getMember(orgId, memberId)

    if (!targetMember) {
      return errorResponse('NOT_FOUND', 'Member not found', 404)
    }

    // Check permissions:
    // - Owner can remove any member except themselves
    // - Admin can remove developers/viewers, not admins/owner
    // - Cannot remove yourself (use leave endpoint)
    if (accessCheck.member.role === 'admin') {
      if (targetMember.role === 'owner' || targetMember.role === 'admin') {
        return errorResponse('FORBIDDEN', 'Admins cannot remove other admins or the owner', 403)
      }
    }

    if (targetMember.user_id === developer.id) {
      return errorResponse('BAD_REQUEST', 'Cannot remove yourself. Use the leave organization feature.', 400)
    }

    // Delete the member
    await pool.query(
      `DELETE FROM control_plane.organization_members
       WHERE id = $1 AND org_id = $2`,
      [memberId, orgId]
    )

    return NextResponse.json({
      success: true,
      data: {
        id: targetMember.id,
        user_id: targetMember.user_id,
        message: 'Member removed successfully'
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error removing organization member:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to remove organization member', 500)
  }
}
