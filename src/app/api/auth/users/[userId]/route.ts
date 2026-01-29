/**
 * API Route: Get User Details
 * GET /api/auth/users/[userId] - Get a single user by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { authServiceClient } from '@/lib/api/auth-service-client'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate the request
    await authenticateRequest(req)

    const { userId } = params

    // Call auth service
    const response = await authServiceClient.getEndUser(userId)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting user:', error)

    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get user' },
      { status: 500 }
    )
  }
}
