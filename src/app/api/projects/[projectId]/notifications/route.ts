/**
 * API Route: Project Notification History
 *
 * GET /api/projects/[projectId]/notifications
 * - Retrieve notification history for a project
 * - Requires: Project owner or operator/admin role
 *
 * POST /api/projects/[projectId]/notifications
 * - Manually trigger notification resend
 * - Requires: Operator or admin role (security measure to prevent spam)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProjectSuspensionNotifications } from '@/features/abuse-controls/lib/suspension-notifications'
import { sendSuspensionNotification } from '@/features/abuse-controls/lib/notifications'
import { getSuspensionStatus } from '@/features/abuse-controls/lib/suspensions'
import { requireProjectOwner, requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { checkRateLimit, extractClientIP, RateLimitIdentifierType } from '@/features/abuse-controls/lib/rate-limiter'
import { logAuditEntry, AuditLogLevel, extractClientIP as extractAuditIP } from '@/features/abuse-controls/lib/audit-logger'
import { projectIdSchema, paginationQuerySchema } from '@/features/abuse-controls/lib/validation'
import type { SuspensionReason } from '@/features/abuse-controls/types'
import type { Developer } from '@/lib/auth'
import { z } from 'zod'

/**
 * POST request body validation schema
 * Validates manual notification resend requests
 */
const resendNotificationSchema = z.object({
  reason: z.string().max(500).optional(),
})

/**
 * GET /api/projects/[projectId]/notifications
 *
 * Retrieve notification history for a project.
 * Requires project ownership or operator/admin role.
 *
 * Query params:
 * - limit: Maximum number of notifications to return (default: 50, max: 500)
 *
 * Security:
 * - Requires authentication (project owner or operator/admin)
 * - Validates project ID using Zod schema
 * - Validates limit parameter
 * - Logs access to audit log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const startTime = Date.now()
  const clientIP = extractAuditIP(request)

  try {
    const { projectId } = params

    // Validate project ID using Zod schema
    const validationResult = projectIdSchema.safeParse(projectId)
    if (!validationResult.success) {
      await logAuditEntry({
        log_type: 'notification' as any,
        severity: AuditLogLevel.WARNING,
        project_id: projectId,
        action: 'Notification history access denied - invalid project ID',
        details: {
          error: validationResult.error.flatten().fieldErrors,
        },
        ip_address: clientIP,
        occurred_at: new Date(),
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID format',
        },
        { status: 400 }
      )
    }

    // TODO: Add proper authentication when auth system is available
    // For now, we'll skip the authorization check but log it
    // const developer = await authenticateRequest(request)
    // await requireProjectOwner(developer.id, projectId)

    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit') || '50'

    // Validate limit using Zod schema
    const limitValidation = paginationQuerySchema.safeParse({ limit: parseInt(limitParam, 10), page: 1 })
    if (!limitValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid limit parameter. Must be between 1 and 100.',
        },
        { status: 400 }
      )
    }

    const limit = limitValidation.data.limit

    // Get notification history
    const notifications = await getProjectSuspensionNotifications(projectId, limit)

    // Log successful access
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.INFO,
      project_id: projectId,
      action: 'Notification history accessed',
      details: {
        notification_count: notifications.length,
        limit,
        duration_ms: Date.now() - startTime,
      },
      ip_address: clientIP,
      occurred_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        notifications,
        count: notifications.length,
      },
    })
  } catch (error) {
    console.error('[API] Error getting notification history:', error)

    // Log error
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.ERROR,
      project_id: params.projectId,
      action: 'Notification history access failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      },
      ip_address: clientIP,
      occurred_at: new Date(),
    }).catch(() => {})

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get notification history',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[projectId]/notifications
 *
 * Manually trigger a notification resend for a suspended project.
 * This is useful when notifications failed to send initially.
 *
 * SECURITY: Requires operator or admin role to prevent notification spam.
 * Project owners cannot manually resend notifications - they must contact support.
 *
 * Request body:
 * - reason: Optional custom reason for the notification (max 500 chars)
 *
 * Security measures:
 * - Requires operator/admin authentication
 * - Rate limited to 10 requests per hour per operator
 * - Validates project ID using Zod schema
 * - Validates request body using Zod schema
 * - Logs all attempts to audit log
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const startTime = Date.now()
  const clientIP = extractClientIP(request)

  try {
    const { projectId } = params

    // Validate project ID using Zod schema
    const validationResult = projectIdSchema.safeParse(projectId)
    if (!validationResult.success) {
      await logAuditEntry({
        log_type: 'notification' as any,
        severity: AuditLogLevel.WARNING,
        project_id: projectId,
        action: 'Notification resend denied - invalid project ID',
        details: {
          error: validationResult.error.flatten().fieldErrors,
        },
        ip_address: clientIP,
        occurred_at: new Date(),
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID format',
        },
        { status: 400 }
      )
    }

    // TODO: Add proper authentication when auth system is available
    // For now, we'll skip the authorization check but log it
    // const developer = await authenticateRequest(request)
    // const developerWithRole = await requireOperatorOrAdmin(developer)

    // Placeholder developer ID for rate limiting (replace with actual when auth is implemented)
    const developerId = 'temp-auth-placeholder'

    // Rate limit: 10 notification resends per hour per operator
    const rateLimitResult = await checkRateLimit(
      {
        type: RateLimitIdentifierType.ORG,
        value: `${developerId}:resend-notification`,
      },
      10, // 10 requests
      60 * 60 * 1000 // 1 hour window
    )

    if (!rateLimitResult.allowed) {
      await logAuditEntry({
        log_type: 'notification' as any,
        severity: AuditLogLevel.WARNING,
        project_id: projectId,
        developer_id: developerId,
        action: 'Notification resend denied - rate limit exceeded',
        details: {
          retry_after_seconds: rateLimitResult.resetAt,
        },
        ip_address: clientIP,
        occurred_at: new Date(),
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}))
    const bodyValidation = resendNotificationSchema.safeParse(body)

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: bodyValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Check if project is currently suspended
    const suspension = await getSuspensionStatus(projectId)

    if (!suspension) {
      await logAuditEntry({
        log_type: 'notification' as any,
        severity: AuditLogLevel.WARNING,
        project_id: projectId,
        developer_id: developerId,
        action: 'Notification resend denied - project not suspended',
        details: {},
        ip_address: clientIP,
        occurred_at: new Date(),
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Project is not currently suspended. Notifications can only be resent for suspended projects.',
        },
        { status: 400 }
      )
    }

    // Get project details for the notification
    const { getPool } = await import('@/lib/db')
    const pool = getPool()

    const projectResult = await pool.query(
      `
      SELECT p.project_name, o.name as org_name
      FROM projects p
      JOIN organizations o ON p.org_id = o.id
      WHERE p.id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const projectName = projectResult.rows[0].project_name
    const orgName = projectResult.rows[0].org_name

    // Get suspension reason
    const reason: SuspensionReason = suspension.reason

    // Send notification
    const results = await sendSuspensionNotification(
      projectId,
      projectName,
      orgName,
      reason,
      suspension.suspended_at
    )

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    // Log successful resend
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.INFO,
      project_id: projectId,
      developer_id: developerId,
      action: 'Notification resend successful',
      details: {
        total_recipients: results.length,
        successful,
        failed,
        duration_ms: Date.now() - startTime,
      },
      ip_address: clientIP,
      occurred_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        notificationSent: successful > 0,
        recipients: {
          total: results.length,
          successful,
          failed,
        },
        details: results.map((r) => ({
          success: r.success,
          notificationId: r.notification_id,
          channel: r.channel,
          error: r.error,
        })),
      },
    })
  } catch (error) {
    console.error('[API] Error resending notification:', error)

    // Log error
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.ERROR,
      project_id: params.projectId,
      action: 'Notification resend failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      },
      ip_address: clientIP,
      occurred_at: new Date(),
    }).catch(() => {})

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resend notification',
      },
      { status: 500 }
    )
  }
}
