/**
 * Admin Users API - DELETE Handler
 *
 * DELETE /api/admin/users/[userId]
 *
 * Remove a user from the platform.
 * Only admins can remove users.
 *
 * This endpoint soft deletes or removes a user account.
 * In production, you might want to implement soft delete instead.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type Developer } from '@/lib/auth'
import { requireAdmin } from '@/features/abuse-controls/lib/authorization'
import { logUserAction, userActor } from '@nextmavenspacks/audit-logs-database'
import { getPool } from '@/lib/db'
import { handleAuthError } from '../utils'

export async function handleDeleteUser(
  req: NextRequest,
  params: { userId: string }
): Promise<NextResponse> {
  let pool
  try {
    // Authenticate and authorize
    const jwtPayload = await authenticateRequest(req)

    // Convert JwtPayload to Developer for authorization
    const developer: Developer = {
      id: jwtPayload.id,
      email: jwtPayload.email,
      name: '', // Name not available in JWT payload
    }
    const admin = await requireAdmin(developer)

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    pool = getPool()

    // Get user details before deletion for audit logging
    const userResult = await pool.query(
      'SELECT id, email, name, organization, role FROM developers WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const targetUser = userResult.rows[0]

    // Prevent self-deletion
    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete the user
    // In production, consider soft delete instead:
    // UPDATE developers SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2
    await pool.query(
      'DELETE FROM developers WHERE id = $1',
      [userId]
    )

    // Log user removal
    try {
      await logUserAction.removed(
        userActor(admin.id),
        targetUser.id,
        'Removed by admin',
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
          metadata: {
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
            organization: targetUser.organization,
          },
        }
      )
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error('[Admin Users] Failed to log user removal:', auditError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User removed successfully',
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Admin Users] Remove user error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to remove user'

    // Check for authentication/authorization errors
    const authError = handleAuthError(errorMessage)
    if (authError) return authError

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
