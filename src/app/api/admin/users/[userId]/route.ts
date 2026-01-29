import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { requireOperatorOrAdmin, requireAdmin } from '@/features/abuse-controls/lib/authorization'
import { logUserAction, logAction, userActor, userTarget } from '@nextmavens/audit-logs-database'
import { z } from 'zod'

/**
 * GET /api/admin/users/[userId]
 *
 * Get detailed information about a specific user.
 * Only operators and admins can view user details.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate and authorize
    const developer = await authenticateRequest(req)
    await requireOperatorOrAdmin(developer)

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const pool = getPool()

    // Fetch user details with parameterized query (SQL injection prevention)
    const userResult = await pool.query(
      `SELECT
        id, email, name, organization, role, created_at, updated_at
      FROM developers
      WHERE id = $1`,
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // Return user data (exclude sensitive fields)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: user.organization,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        auth_provider: 'email' as const,
        auth_info: {
          user_id: user.id,
          email: user.email,
          name: user.name,
          tenant_id: 'default',
          role: user.role || 'member',
          is_verified: true,
          last_login_at: null,
          sign_in_count: 0,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
        },
        user_metadata: {},
      },
    })
  } catch (error: unknown) {
    console.error('[Admin Users] Get user error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user details'

    // Generic error messages to prevent information leakage
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (errorMessage.includes('operator or administrator') || errorMessage.includes('administrator privileges')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[userId]
 *
 * Update user metadata.
 * Only operators and admins can update user metadata.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate and authorize
    const developer = await authenticateRequest(req)
    const authorizedDeveloper = await requireOperatorOrAdmin(developer)

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()

    // Schema validation for user_metadata (prevent injection attacks)
    const metadataSchema = z.object({
      user_metadata: z.record(z.string(), z.unknown()).optional(),
    })

    const validationResult = metadataSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { user_metadata } = validationResult.data

    const pool = getPool()

    // Check if user exists (generic error message)
    const userExists = await pool.query(
      'SELECT id FROM developers WHERE id = $1',
      [userId]
    )

    if (userExists.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 404 }
      )
    }

    // Update user metadata (if implemented in DB schema)
    // For now, this is a placeholder as the developers table may not have a user_metadata column
    // When implemented, use parameterized query:
    // await pool.query(
    //   'UPDATE developers SET user_metadata = $1, updated_at = NOW() WHERE id = $2',
    //   [JSON.stringify(user_metadata), userId]
    // )

    // Log the update action
    try {
      await logAction(
        userActor(authorizedDeveloper.id),
        'user.metadata_updated',
        userTarget(userId),
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
          metadata: {
            fields_updated: Object.keys(user_metadata || {}),
          },
        }
      )
    } catch (auditError) {
      console.error('[Admin Users] Failed to log user update:', auditError)
    }

    // Fetch updated user
    const updatedUserResult = await pool.query(
      `SELECT
        id, email, name, organization, role, created_at, updated_at
      FROM developers
      WHERE id = $1`,
      [userId]
    )

    const updatedUser = updatedUserResult.rows[0]

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        organization: updatedUser.organization,
        role: updatedUser.role,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        auth_provider: 'email' as const,
        auth_info: {
          user_id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          tenant_id: 'default',
          role: updatedUser.role || 'member',
          is_verified: true,
          last_login_at: null,
          sign_in_count: 0,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at || updatedUser.created_at,
        },
        user_metadata: user_metadata || {},
      },
    })
  } catch (error: unknown) {
    console.error('[Admin Users] Update user error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to update user'

    // Generic error messages
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (errorMessage.includes('operator or administrator') || errorMessage.includes('administrator privileges')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId]
 *
 * Remove a user from the platform.
 * Only admins can remove users.
 *
 * This endpoint soft deletes or removes a user account.
 * In production, you might want to implement soft delete instead.
 */
export async function DELETE(
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
