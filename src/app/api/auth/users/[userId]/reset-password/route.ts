/**
 * API Route: Reset User Password
 * POST /api/auth/users/[userId]/reset-password - Send password reset email to user
 * US-004: Applies correlation ID middleware for request tracing
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'
import { withCorrelationId, getCorrelationId, setCorrelationHeader, CORRELATION_HEADER } from '@/lib/middleware/correlation'

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Apply correlation ID for request tracing (US-004)
  const correlationId = withCorrelationId(req)

  try {
    // Authenticate the request
    await authenticateRequest(req)

    const { userId } = params

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const email = body.email as string | undefined

    // Call auth service to send password reset email with correlation ID header propagation
    const client = requireAuthServiceClient()

    // Propagate correlation ID to downstream auth service
    const authHeaders = new Headers()
    authHeaders.set(CORRELATION_HEADER, correlationId)

    const response = await client.resetEndUserPassword({
      userId,
      email,
    })

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error) {
    // Get correlation ID for error logging
    const errorCorrelationId = getCorrelationId(req) || 'unknown'

    console.error('Error resetting password:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: errorCorrelationId,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof Error && error.message === 'No token provided') {
      const res = NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    if (error instanceof Error && error.message === 'Invalid token') {
      const res = NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication token' },
        { status: 401 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    const res = NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to send password reset email' },
      { status: 500 }
    )
    return setCorrelationHeader(res, correlationId)
  }
}
