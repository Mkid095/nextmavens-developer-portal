/**
 * API Route: Disable User
 * POST /api/auth/users/[userId]/disable - Disable a user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate the request
    await authenticateRequest(req)

    const { userId } = params

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const reason = body.reason as string | undefined

    // Call auth service
    const response = await client = requireAuthServiceClient(); client.disableEndUser({
      userId,
      reason,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error disabling user:', error)

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
      { error: 'Internal Server Error', message: 'Failed to disable user' },
      { status: 500 }
    )
  }
}
