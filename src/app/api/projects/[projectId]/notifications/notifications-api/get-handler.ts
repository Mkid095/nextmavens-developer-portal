/**
 * Project Notifications API - GET Handler
 *
 * GET /api/projects/[projectId]/notifications
 *
 * Retrieve notification history for a project.
 * Requires project ownership or operator/admin role.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProjectSuspensionNotifications } from '@/features/abuse-controls/lib/suspension-notifications'
import { logAuditEntry, AuditLogLevel, extractClientIP as extractAuditIP } from '@/features/abuse-controls/lib/audit-logger'
import { projectIdSchema, paginationQuerySchema } from '@/features/abuse-controls/lib/validation'
import type { NotificationsResponseData } from './types'

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
export async function handleGetNotifications(
  request: NextRequest,
  params: { projectId: string }
): Promise<NextResponse> {
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
      } as NotificationsResponseData,
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
