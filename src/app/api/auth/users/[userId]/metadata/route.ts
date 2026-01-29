/**
 * API Route: Update User Metadata
 * PATCH /api/auth/users/[userId]/metadata - Update user metadata
 *
 * SECURITY: Requires operator or admin role
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { requireAuthServiceClient } from '@/lib/api/auth-service-client'
import { logAuditEntry, AuditLogType, AuditLogLevel, extractClientIP, extractUserAgent } from '@/features/abuse-controls/lib/audit-logger'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const clientIP = extractClientIP(req)
  const userAgent = extractUserAgent(req)

  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can update user metadata
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
    const body = await req.json()
    const metadata = body.metadata as Record<string, unknown>

    if (!metadata || typeof metadata !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'metadata is required and must be an object' },
        { status: 400 }
      )
    }

    // Call auth service
    const client = requireAuthServiceClient()
    const response = await client.updateEndUserMetadata({
      userId,
      metadata,
    })

    // Audit log the metadata update
    await logAuditEntry({
      log_type: AuditLogType.MANUAL_INTERVENTION,
      severity: AuditLogLevel.INFO,
      developer_id: developerWithRole.id,
      action: 'User metadata updated',
      details: {
        target_user_id: userId,
        performed_by: developerWithRole.email,
        role: developerWithRole.role,
      },
      ip_address: clientIP,
      user_agent: userAgent,
      occurred_at: new Date(),
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Security] Error updating user metadata:', error)

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

    // Check for authorization errors
    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update user metadata' },
      { status: 500 }
    )
  }
}
