/**
 * API Route: Revoke User Session
 * DELETE /api/auth/users/[userId]/sessions/[sessionId] - Revoke a specific session
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string; sessionId: string } }
) {
  // Apply correlation ID for request tracing (US-004)
  const correlationId = withCorrelationId(req)

  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can revoke sessions
    const developerWithRole = await requireOperatorOrAdmin(developer)

    const { userId, sessionId } = params

    // Validate parameters
    if (!userId || typeof userId !== 'string') {
      const res = NextResponse.json(
        { error: 'Bad Request', message: 'Invalid user ID' },
        { status: 400 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    if (!sessionId || typeof sessionId !== 'string') {
      const res = NextResponse.json(
        { error: 'Bad Request', message: 'Invalid session ID' },
        { status: 400 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    // Call auth service with correlation ID header propagation
    const client = requireAuthServiceClient()

    // Propagate correlation ID to downstream auth service
    const authHeaders = new Headers()
    authHeaders.set(CORRELATION_HEADER, correlationId)

    const response = await client.revokeEndUserSession({ userId, sessionId })

    // Audit log the session revocation
    await logAuditEntry({
      log_type: AuditLogType.MANUAL_INTERVENTION,
      severity: AuditLogLevel.WARNING,
      developer_id: developerWithRole.id,
      action: 'User session revoked',
      details: {
        target_user_id: userId,
        session_id: sessionId,
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

    console.error('[Security] Error revoking session:', {
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

    if (error instanceof Error && error.name === 'AuthorizationError') {
      const res = NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
      return setCorrelationHeader(res, correlationId)
    }

    const res = NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to revoke session' },
      { status: 500 }
    )
    return setCorrelationHeader(res, correlationId)
  }
}
