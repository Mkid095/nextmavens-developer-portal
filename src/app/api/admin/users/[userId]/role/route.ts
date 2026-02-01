import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { requireAdmin, UserRole } from '@/features/abuse-controls/lib/authorization'
import { logUserAction, userActor } from '@nextmavenspacks/audit-logs-database'

/**
 * PATCH /api/admin/users/[userId]/role
 *
 * Change a user's role.
 * Only admins can change user roles.
 *
 * Request body:
 * {
 *   "role": "developer" | "operator" | "admin"
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  let pool
  try {
    // Authenticate and authorize
    const developer = await authenticateRequest(req)
    const admin = await requireAdmin(developer)

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { role } = body

    // Validate role
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    const validRoles = [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.ADMIN]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    pool = getPool()

    // Get current user details
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
    const oldRole = targetUser.role

    // Check if role is actually changing
    if (oldRole === role) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 400 }
      )
    }

    // Prevent self-role-change
    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Update user role
    await pool.query(
      'UPDATE developers SET role = $1 WHERE id = $2',
      [role, userId]
    )

    // Log role change
    try {
      await logUserAction.roleChanged(
        userActor(admin.id),
        targetUser.id,
        oldRole,
        role,
        targetUser.organization || 'default',
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
          metadata: {
            email: targetUser.email,
            name: targetUser.name,
          },
        }
      )
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error('[Admin Users] Failed to log role change:', auditError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User role updated successfully',
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          organization: targetUser.organization,
          oldRole,
          newRole: role,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Admin Users] Change role error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to change user role'

    // Check for authentication/authorization errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    if (errorMessage.includes('administrator privileges')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
