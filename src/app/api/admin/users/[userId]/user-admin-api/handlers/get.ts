/**
 * Admin Users API - GET Handler
 *
 * GET /api/admin/users/[userId]
 *
 * Get detailed information about a specific user.
 * Only operators and admins can view user details.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type Developer } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { fetchUserById, createUserResponse, handleAuthError } from '../utils'

export async function handleGetUser(
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
    await requireOperatorOrAdmin(developer)

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user details
    const user = await fetchUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 404 }
      )
    }

    // Return user data (exclude sensitive fields)
    return createUserResponse(user)
  } catch (error: unknown) {
    console.error('[Admin Users] Get user error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user details'

    // Generic error messages to prevent information leakage
    const authError = handleAuthError(errorMessage)
    if (authError) return authError

    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}
