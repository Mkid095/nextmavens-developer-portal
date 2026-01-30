import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { z } from 'zod'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Accept invitation schema
const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
})

// POST /v1/orgs/:id/accept - Accept organization invitation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: { token: string }
    try {
      validatedData = acceptInvitationSchema.parse(body)
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

    const pool = getPool()

    // Find the pending invitation by token and org_id
    const invitationResult = await pool.query(
      `SELECT id, org_id, email, role, status, invitation_token, token_expires_at, invited_by
       FROM control_plane.organization_members
       WHERE org_id = $1 AND invitation_token = $2 AND status = 'pending'`,
      [params.id, validatedData.token]
    )

    if (invitationResult.rows.length === 0) {
      return errorResponse(
        'NOT_FOUND',
        'Invalid or expired invitation token',
        404
      )
    }

    const invitation = invitationResult.rows[0]

    // Check if token has expired
    if (invitation.token_expires_at && new Date(invitation.token_expires_at) < new Date()) {
      return errorResponse(
        'TOKEN_EXPIRED',
        'Invitation token has expired',
        400
      )
    }

    // Verify that the authenticated user's email matches the invitation email
    const developerResult = await pool.query(
      'SELECT id, email FROM developers WHERE id = $1',
      [developer.id]
    )

    if (developerResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Developer not found', 404)
    }

    const developerData = developerResult.rows[0]

    // Normalize emails for comparison
    const normalizedInvitationEmail = invitation.email?.toLowerCase().trim()
    const normalizedDeveloperEmail = developerData.email?.toLowerCase().trim()

    if (normalizedInvitationEmail !== normalizedDeveloperEmail) {
      return errorResponse(
        'FORBIDDEN',
        'This invitation was sent to a different email address',
        403
      )
    }

    // Accept the invitation: update user_id, status, and joined_at
    const updateResult = await pool.query(
      `UPDATE control_plane.organization_members
       SET user_id = $1,
           status = 'accepted',
           joined_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, org_id, user_id, email, role, status, joined_at, created_at`,
      [developer.id, invitation.id]
    )

    const member = updateResult.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        org_id: member.org_id,
        user_id: member.user_id,
        email: member.email,
        role: member.role,
        status: member.status,
        joined_at: member.joined_at,
        created_at: member.created_at,
      }
    }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error accepting invitation:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to accept invitation', 500)
  }
}
