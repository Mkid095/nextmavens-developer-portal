import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getPool } from '@/lib/db'
import { updateMemberRoleSchema } from '@/lib/validation'
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

// Extract organization ID from URL path
function getOrgIdFromRequest(req: NextRequest): string {
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const orgIdIndex = pathParts.indexOf('orgs') + 1
  return pathParts[orgIdIndex]
}

// PUT /v1/orgs/:id/members/:userId - Update member role
// US-008: Only owners can manage users (update member roles)
export const PUT = requirePermission(
  {
    permission: Permission.PROJECTS_MANAGE_USERS,
    getOrganizationId: getOrgIdFromRequest
  },
  async (req: NextRequest, user: User) => {
    try {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const orgIdIndex = pathParts.indexOf('orgs') + 1
      const userIdIndex = pathParts.indexOf('members') + 1
      const orgId = pathParts[orgIdIndex]
      const userId = pathParts[userIdIndex]

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

      const pool = getPool()

      // Get current member data
      const currentMember = await pool.query(
        'SELECT role FROM control_plane.organization_members WHERE org_id = $1 AND user_id = $2',
        [orgId, userId]
      )

      if (currentMember.rows.length === 0) {
        return errorResponse('NOT_FOUND', 'Member not found', 404)
      }

      // Prevent removing or changing the owner's role
      const orgData = await pool.query(
        'SELECT owner_id FROM control_plane.organizations WHERE id = $1',
        [orgId]
      )

      if (orgData.rows.length > 0 && orgData.rows[0].owner_id === userId) {
        return errorResponse('FORBIDDEN', 'Cannot change the role of the organization owner', 403)
      }

      // Update member role
      const result = await pool.query(
        `UPDATE control_plane.organization_members
         SET role = $1
         WHERE org_id = $2 AND user_id = $3
         RETURNING org_id, user_id, role, joined_at, created_at`,
        [validatedData.role, orgId, userId]
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
)

// DELETE /v1/orgs/:id/members/:userId - Remove member from organization
// US-008: Only owners can manage users (remove members)
export const DELETE = requirePermission(
  {
    permission: Permission.PROJECTS_MANAGE_USERS,
    getOrganizationId: getOrgIdFromRequest
  },
  async (req: NextRequest, user: User) => {
    try {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const orgIdIndex = pathParts.indexOf('orgs') + 1
      const userIdIndex = pathParts.indexOf('members') + 1
      const orgId = pathParts[orgIdIndex]
      const userId = pathParts[userIdIndex]

      const pool = getPool()

      // Prevent removing the owner
      const orgData = await pool.query(
        'SELECT owner_id FROM control_plane.organizations WHERE id = $1',
        [orgId]
      )

      if (orgData.rows.length > 0 && orgData.rows[0].owner_id === userId) {
        return errorResponse('FORBIDDEN', 'Cannot remove the organization owner', 403)
      }

      // Check if member exists
      const existingMember = await pool.query(
        'SELECT user_id FROM control_plane.organization_members WHERE org_id = $1 AND user_id = $2',
        [orgId, userId]
      )

      if (existingMember.rows.length === 0) {
        return errorResponse('NOT_FOUND', 'Member not found', 404)
      }

      // Remove member
      await pool.query(
        'DELETE FROM control_plane.organization_members WHERE org_id = $1 AND user_id = $2',
        [orgId, userId]
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
)
