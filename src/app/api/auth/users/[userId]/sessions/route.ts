/**
 * API Route: Get User Sessions
 * GET /api/auth/users/[userId]/sessions - Get all sessions for a user
 *
 * SECURITY: Requires operator or admin role
 * US-004: Applies correlation ID middleware for request tracing
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'
import { logAuditEntry, AuditLogType, AuditLogLevel, extractClientIP, extractUserAgent } from '@/features/abuse-controls/lib/audit-logger'
import { withCorrelationId, getCorrelationId, setCorrelationHeader, CORRELATION_HEADER } from '@/lib/middleware/correlation'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Apply correlation ID for request tracing (US-004)
  const correlationId = withCorrelationId(req)

  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can view user sessions
    const developerWithRole = await requireOperatorOrAdmin(developer)

    const { userId } = params

    // Validate userId parameter
    if (!userId || typeof userId !== 'string') {
      const res = NextResponse.json(
        { error: 'Bad Request', message: 'Invalid user ID' },
        { status: 400 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    // Call auth service with correlation ID header propagation
    const client = requireAuthServiceClient()

    // Propagate correlation ID to downstream auth service
    const authHeaders = new Headers()
    authHeaders.set(CORRELATION_HEADER, correlationId)

    const response = await client.getEndUserSessions(userId)

    // Audit log the session view
    await logAuditEntry({
      log_type: AuditLogType.MANUAL_INTERVENTION,
      severity: AuditLogLevel.INFO,
      developer_id: developerWithRole.id,
      action: 'User sessions viewed',
      details: {
        target_user_id: userId,
        performed_by: developerWithRole.email,
        role: developerWithRole.role,
      },
      ip_address: clientIP,
      user_agent: userAgent,
      occurred_at: new Date(),
    })

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error) {
    // Get correlation ID for error logging
    const errorCorrelationId = getCorrelationId(req) || 'unknown'

    console.error('[Security] Error getting user sessions:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: errorCorrelationId,
      timestamp: new Date().toISOString(),
    })

    // Generic error handling to prevent information leakage
    if (error instanceof Error && (
      error.message === 'No token provided' ||
      error.message === 'Invalid token'
    )) {
      const res = NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    // Check for authorization errors
    if (error instanceof Error && error.name === 'AuthorizationError') {
      const res = NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    const res = NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get user sessions' },
      { status: 500 }
    )
    return setCorrelationHeader(res, correlationId)
  }
}
