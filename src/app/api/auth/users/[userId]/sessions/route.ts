/**
 * API Route: Get User Sessions
 * GET /api/auth/users/[userId]/sessions - Get all sessions for a user
 *
 * SECURITY: Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate the request
    await authenticateRequest(req)

    const { userId } = params

    // Validate userId parameter
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Call auth service
    const client = requireAuthServiceClient()
    const response = await client.getEndUserSessions(userId)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Security] Error getting user sessions:', error)

    // Generic error handling to prevent information leakage
    if (error instanceof Error && (
      error.message === 'No token provided' ||
      error.message === 'Invalid token'
    )) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get user sessions' },
      { status: 500 }
    )
  }
}
