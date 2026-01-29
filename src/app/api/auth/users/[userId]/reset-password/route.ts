/**
 * API Route: Reset User Password
 * POST /api/auth/users/[userId]/reset-password - Send password reset email to user
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
    const email = body.email as string | undefined

    // Call auth service to send password reset email
    const client = requireAuthServiceClient()
    const response = await client.resetEndUserPassword({
      userId,
      email,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error resetting password:', error)

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
      { error: 'Internal Server Error', message: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}
