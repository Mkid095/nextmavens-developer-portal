/**
 * API Route: Update User Metadata
 * PATCH /api/auth/users/[userId]/metadata - Update user metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate the request
    await authenticateRequest(req)

    const { userId } = params

    // Parse request body
    const body = await req.json()
    const metadata = body.metadata as Record<string, unknown>

    if (!metadata || typeof metadata !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'metadata is required and must be an object' },
        { status: 400 }
      )
    }

    // Call auth service
    const response = await client = requireAuthServiceClient(); client.updateEndUserMetadata({
      userId,
      metadata,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating user metadata:', error)

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
      { error: 'Internal Server Error', message: 'Failed to update user metadata' },
      { status: 500 }
    )
  }
}
