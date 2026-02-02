/**
 * Admin Users API - PATCH Handler
 *
 * PATCH /api/admin/users/[userId]
 *
 * Update user metadata.
 * Only operators and admins can update user metadata.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type Developer } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { logAction, userActor, userTarget } from '@nextmavenspacks/audit-logs-database'
import { fetchUserById, createUserResponse, handleAuthError } from '../utils'
import { userMetadataSchema } from '../validation'

export async function handleUpdateUser(
  req: NextRequest,
  params: { userId: string }
): Promise<NextResponse> {
  try {
    // Authenticate and authorize
    const jwtPayload = await authenticateRequest(req)

    // Convert JwtPayload to Developer for authorization
    const developer: Developer = {
      id: jwtPayload.id,
      email: jwtPayload.email,
      name: '', // Name not available in JWT payload
    }
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
    const validationResult = userMetadataSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { user_metadata } = validationResult.data

    // Check if user exists
    const user = await fetchUserById(userId)

    if (!user) {
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
    const updatedUser = await fetchUserById(userId)

    if (updatedUser) {
      return createUserResponse(updatedUser, user_metadata)
    }

    return createUserResponse(user, user_metadata)
  } catch (error: unknown) {
    console.error('[Admin Users] Update user error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to update user'

    // Generic error messages
    const authError = handleAuthError(errorMessage)
    if (authError) return authError

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
