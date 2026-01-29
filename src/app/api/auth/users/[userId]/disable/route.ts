/**
 * API Route: Disable User
 * POST /api/auth/users/[userId]/disable - Disable a user account
 *
 * SECURITY: Requires operator or admin role
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'
import { logAuditEntry, AuditLogType, AuditLogLevel, extractClientIP, extractUserAgent } from '@/features/abuse-controls/lib/audit-logger'

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can disable users
    const developerWithRole = await requireOperatorOrAdmin(developer)

    const { userId } = params

    // Validate userId parameter
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const reason = body.reason as string | undefined

    // Call auth service
    const client = requireAuthServiceClient()
    const response = await client.disableEndUser({
      userId,
      reason,
    })

    // Audit log the disable action
    await logAuditEntry({
      log_type: AuditLogType.MANUAL_INTERVENTION,
      severity: AuditLogLevel.WARNING,
      developer_id: developerWithRole.id,
      action: 'User disabled',
      details: {
        target_user_id: userId,
        reason: reason || 'No reason provided',
        performed_by: developerWithRole.email,
        role: developerWithRole.role,
      },
      ip_address: clientIP,
      user_agent: userAgent,
      occurred_at: new Date(),
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Security] Error disabling user:', error)

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
      { error: 'Internal Server Error', message: 'Failed to disable user' },
      { status: 500 }
    )
  }
}
