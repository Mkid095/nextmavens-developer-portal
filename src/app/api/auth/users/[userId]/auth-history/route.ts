/**
 * API Route: Get User Authentication History
 * GET /api/auth/users/[userId]/auth-history - Get authentication history for a user
 *
 * SECURITY: Requires operator or admin role
 * US-004: Applies correlation ID middleware for request tracing
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { logAuditEntry, AuditLogType, AuditLogLevel, extractClientIP, extractUserAgent } from '@/features/abuse-controls/lib/audit-logger'
import { withCorrelationId, getCorrelationId, setCorrelationHeader, CORRELATION_HEADER } from '@/lib/middleware/correlation'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Apply correlation ID for request tracing (US-004)
  const correlationId = withCorrelationId(req)

  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can view auth history
    const developerWithRole = await requireOperatorOrAdmin(developer)

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

    // Call auth service with correlation ID header propagation
    const client = requireAuthServiceClient()

    // Propagate correlation ID to downstream auth service
    const authHeaders = new Headers()
    authHeaders.set(CORRELATION_HEADER, correlationId)

    const response = await client.getEndUserAuthHistory(userId, { limit, offset })

    // Audit log the auth history view
    await logAuditEntry({
      log_type: AuditLogType.MANUAL_INTERVENTION,
      severity: AuditLogLevel.INFO,
      developer_id: developerWithRole.id,
      action: 'auth_history_viewed',
      details: {
        target_user_id: userId,
        performed_by: developerWithRole.email,
        role: developerWithRole.role,
      },
      ip_address: extractClientIP(req),
      user_agent: extractUserAgent(req),
      occurred_at: new Date(),
    })

    // Set correlation ID in response headers for traceability
    let res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error) {
    // Get correlation ID for error logging
    const correlationId = getCorrelationId(req) || 'unknown'

    console.error('Error getting auth history:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
      timestamp: new Date().toISOString(),
    })

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

    // Check for authorization errors
    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const res = NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get authentication history' },
      { status: 500 }
    )
    return setCorrelationHeader(res, correlationId)
  }
}
