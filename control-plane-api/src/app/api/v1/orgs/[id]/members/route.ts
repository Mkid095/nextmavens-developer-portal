import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { addMemberSchema, inviteMemberSchema, type AddMemberInput, type InviteMemberInput } from '@/lib/validation'

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

// GET /v1/orgs/:id/members - List organization members
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const orgId = params.id

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate organization access (viewer or higher)
    const accessCheck = await validateOrganizationAccess(orgId, developer, false)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You do not have access to this organization', 403)
    }

    // Get organization members
    const result = await pool.query(
      `SELECT
        om.id, om.user_id, om.role, om.status,
        om.invited_by, om.invited_at, om.accepted_at,
        om.created_at, om.updated_at
      FROM control_plane.organization_members om
      WHERE om.org_id = $1
      ORDER BY om.created_at ASC
      LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        invited_by: m.invited_by,
        invited_at: m.invited_at,
        accepted_at: m.accepted_at,
        created_at: m.created_at,
        updated_at: m.updated_at,
      })),
      meta: {
        limit,
        offset,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing organization members:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list organization members', 500)
  }
}

// POST /v1/orgs/:id/members - Add member to organization (admin or owner only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()
    const pool = getPool()
    const orgId = params.id

    // Validate organization access (admin or higher)
    const accessCheck = await validateOrganizationAccess(orgId, developer, true)
    if (!accessCheck.valid) {
      return errorResponse('FORBIDDEN', 'You must be an admin or owner to add members', 403)
    }

    // Validate request body - can be either user_id (existing user) or email (invite)
    let validatedData: AddMemberInput | InviteMemberInput
    let userId: string | undefined
    let isInvite = false

    // Try parsing as addMemberSchema (user_id)
    try {
      validatedData = addMemberSchema.parse(body)
      userId = (validatedData as AddMemberInput).user_id
    } catch (error) {
      // If that fails, try parsing as inviteMemberSchema (email)
      if (error instanceof ZodError) {
        try {
          validatedData = inviteMemberSchema.parse(body)
          isInvite = true
          // For invites, we'll use the email as a placeholder user_id
          // In production, you'd send an actual invite email
          userId = (validatedData as InviteMemberInput).email
        } catch (inviteError) {
          if (inviteError instanceof ZodError) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Either user_id (existing user) or email (invite) is required',
              400
            )
          }
          throw inviteError
        }
      } else {
        throw error
      }
    }

    const role = validatedData.role || 'developer'

    // Check if user is already a member
    const existingMember = await pool.query(
      `SELECT id, status FROM control_plane.organization_members
       WHERE org_id = $1 AND user_id = $2`,
      [orgId, userId]
    )

    if (existingMember.rows.length > 0) {
      const member = existingMember.rows[0]
      if (member.status === 'accepted') {
        return errorResponse('CONFLICT', 'User is already a member of this organization', 409)
      }
      // Member exists but pending/declined - update instead
      const result = await pool.query(
        `UPDATE control_plane.organization_members
         SET role = $1, status = 'accepted', accepted_at = NOW(), updated_at = NOW(),
             invited_by = $2, invited_at = COALESCE(invited_at, NOW())
         WHERE id = $3
         RETURNING id, user_id, role, status, invited_by, invited_at, accepted_at, created_at, updated_at`,
        [role, developer.id, member.id]
      )

      return NextResponse.json({
        success: true,
        data: {
          id: result.rows[0].id,
          user_id: result.rows[0].user_id,
          role: result.rows[0].role,
          status: result.rows[0].status,
          invited_by: result.rows[0].invited_by,
          invited_at: result.rows[0].invited_at,
          accepted_at: result.rows[0].accepted_at,
          created_at: result.rows[0].created_at,
          updated_at: result.rows[0].updated_at,
          message: isInvite ? 'Invitation accepted' : 'Member added successfully'
        }
      })
    }

    // Add new member
    const result = await pool.query(
      `INSERT INTO control_plane.organization_members
       (org_id, user_id, role, status, invited_by, invited_at, accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, role, status, invited_by, invited_at, accepted_at, created_at, updated_at`,
      [
        orgId,
        userId,
        role,
        isInvite ? 'pending' : 'accepted',
        developer.id,
        isInvite ? new Date() : null,
        isInvite ? null : new Date(),
      ]
    )

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
        message: isInvite ? 'Invitation sent' : 'Member added successfully'
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error adding organization member:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to add organization member', 500)
  }
}
