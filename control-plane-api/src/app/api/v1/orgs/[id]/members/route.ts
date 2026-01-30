import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import crypto from 'crypto'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { inviteMemberSchema } from '@/lib/validation'
import { sendOrganizationInvitationEmail } from '@/lib/email'
import { requirePermission } from '@/lib/middleware'
import { Permission } from '@/lib/types/rbac.types'
import type { User } from '@/lib/rbac'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Generate secure invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// POST /v1/orgs/:id/members - Invite member to organization by email
// US-008: Only owners can manage users (invite members)
export const POST = requirePermission(
  {
    permission: Permission.PROJECTS_MANAGE_USERS,
    getOrganizationId: (req) => {
      // Extract org ID from URL path: /v1/orgs/[id]/members
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const orgIdIndex = pathParts.indexOf('orgs') + 1
      return pathParts[orgIdIndex]
    }
  },
  async (req: NextRequest, user: User) => {
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

      // Get organization ID from URL path
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const orgIdIndex = pathParts.indexOf('orgs') + 1
      const orgId = pathParts[orgIdIndex]

      const pool = getPool()

      // Get organization details and inviter details for email
      const orgResult = await pool.query(
        'SELECT id, name, slug, owner_id FROM control_plane.organizations WHERE id = $1',
        [orgId]
      )

      if (orgResult.rows.length === 0) {
        return errorResponse('NOT_FOUND', 'Organization not found', 404)
      }

      const organization = orgResult.rows[0]

      // Get inviter details for email
      const inviterResult = await pool.query(
        'SELECT id, name, email FROM developers WHERE id = $1',
        [developer.id]
      )

      const inviter = inviterResult.rows[0]

      // Normalize email to lowercase
      const normalizedEmail = validatedData.email.toLowerCase().trim()

      // Check if there's already a pending or accepted invitation for this email
      const existingMember = await pool.query(
        `SELECT id, user_id, email, status, role, created_at
         FROM control_plane.organization_members
         WHERE org_id = $1 AND (LOWER(email) = LOWER($2) OR user_id IN (
           SELECT id FROM developers WHERE LOWER(email) = LOWER($2)
         ))`,
        [orgId, normalizedEmail]
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
        [orgId, normalizedEmail, validatedData.role, invitationToken, tokenExpiresAt, developer.id]
      )

      const member = result.rows[0]

      // Send invitation email
      if (inviter) {
        try {
          const emailResult = await sendOrganizationInvitationEmail({
            to: normalizedEmail,
            organizationName: organization.name,
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
)
