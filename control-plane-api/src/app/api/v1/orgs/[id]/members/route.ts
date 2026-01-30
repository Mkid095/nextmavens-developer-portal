import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import crypto from 'crypto'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { inviteMemberSchema } from '@/lib/validation'
import { sendOrganizationInvitationEmail } from '@/lib/email'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate organization ownership/admin access
async function validateOrganizationOwnership(
  orgId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; organization?: any; membership?: any; inviter?: any }> {
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

  // Get inviter details for email
  const inviterResult = await pool.query(
    'SELECT id, name, email FROM developers WHERE id = $1',
    [developer.id]
  )

  return { valid: true, organization, membership: organization, inviter: inviterResult.rows[0] }
}

// Generate secure invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// POST /v1/orgs/:id/members - Invite member to organization by email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body - now expects email instead of user_id
    let validatedData: any
    try {
      validatedData = inviteMemberSchema.parse(body)
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

    // Check ownership/admin access (only owners/admins can invite)
    const ownershipCheck = await validateOrganizationOwnership(params.id, developer)
    if (!ownershipCheck.valid) {
      if (ownershipCheck.organization) {
        return errorResponse('FORBIDDEN', 'Only owners and admins can invite members', 403)
      }
      return errorResponse('NOT_FOUND', 'Organization not found', 404)
    }

    const pool = getPool()

    // Normalize email to lowercase
    const normalizedEmail = validatedData.email.toLowerCase().trim()

    // Check if there's already a pending or accepted invitation for this email
    const existingMember = await pool.query(
      `SELECT id, user_id, email, status, role, created_at
       FROM control_plane.organization_members
       WHERE org_id = $1 AND (LOWER(email) = LOWER($2) OR user_id IN (
         SELECT id FROM developers WHERE LOWER(email) = LOWER($2)
       ))`,
      [params.id, normalizedEmail]
    )

    if (existingMember.rows.length > 0) {
      const member = existingMember.rows[0]
      if (member.status === 'pending') {
        return errorResponse(
          'PENDING_INVITATION',
          'A pending invitation already exists for this email',
          409
        )
      }
      return errorResponse(
        'ALREADY_MEMBER',
        'This user is already a member of the organization',
        409
      )
    }

    // Generate invitation token and expiry (7 days from now)
    const invitationToken = generateInvitationToken()
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7)

    // Create pending membership
    const result = await pool.query(
      `INSERT INTO control_plane.organization_members (org_id, email, role, status, invitation_token, token_expires_at, invited_by)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6)
       RETURNING id, org_id, email, role, status, invitation_token, token_expires_at, invited_by, created_at`,
      [params.id, normalizedEmail, validatedData.role, invitationToken, tokenExpiresAt, developer.id]
    )

    const member = result.rows[0]

    // Send invitation email
    const org = ownershipCheck.organization
    const inviter = ownershipCheck.inviter

    if (org && inviter) {
      try {
        const emailResult = await sendOrganizationInvitationEmail({
          to: normalizedEmail,
          organizationName: org.name,
          inviterName: inviter.name || 'A team member',
          role: validatedData.role,
          token: invitationToken,
          expiresAt: tokenExpiresAt,
        })

        if (!emailResult.success) {
          console.warn(`[InviteMember] Failed to send invitation email to ${normalizedEmail}:`, emailResult.error)
          // Don't fail the request if email fails - invitation is still created
        }
      } catch (emailError) {
        console.error('[InviteMember] Error sending invitation email:', emailError)
        // Don't fail the request if email fails - invitation is still created
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        org_id: member.org_id,
        email: member.email,
        role: member.role,
        status: member.status,
        invited_by: member.invited_by,
        created_at: member.created_at,
        expires_at: member.token_expires_at,
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error inviting member:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to invite member', 500)
  }
}
