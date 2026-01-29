/**
 * API Route: Revoke User Session
 * DELETE /api/auth/users/[userId]/sessions/[sessionId] - Revoke a specific session
 *
 * SECURITY: Requires operator or admin role
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'
import { logAuditEntry, AuditLogType, AuditLogLevel, extractClientIP, extractUserAgent } from '@/features/abuse-controls/lib/audit-logger'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string; sessionId: string } }
) {
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
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid user ID' },
        { status: 400 }
      )
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid session ID' },
        { status: 400 }
      )
    }

    // Call auth service
    const client = requireAuthServiceClient()
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

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Security] Error revoking session:', error)

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

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to revoke session' },
      { status: 500 }
    )
  }
}
