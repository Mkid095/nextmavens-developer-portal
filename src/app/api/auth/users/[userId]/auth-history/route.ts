/**
 * API Route: Get User Authentication History
 * GET /api/auth/users/[userId]/auth-history - Get authentication history for a user
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
    const { searchParams } = new URL(req.url)

    // Get pagination parameters
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Offset must be non-negative' },
        { status: 400 }
      )
    }

    // Call auth service
    const client = requireAuthServiceClient()
    const response = await client.getEndUserAuthHistory(userId, { limit, offset })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting auth history:', error)

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
      { error: 'Internal Server Error', message: 'Failed to get authentication history' },
      { status: 500 }
    )
  }
}
