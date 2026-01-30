/**
 * Quota Warnings Library
 *
 * Manages quota warning notifications when projects approach their limits.
 * Sends warnings at 80% and 90% of quota usage via email and dashboard alerts.
 *
 * US-005: Implement Quota Warnings
 * - Warning sent at 80% of quota
 * - Warning sent at 90% of quota
 * - Notification sent via email
 * - Warning shown in dashboard
 * - Clear and actionable warning messages
 */

import { getPool } from '@/lib/db'
import {
  createNotification,
  sendEmailNotification,
  getNotificationRecipients,
} from './notifications'
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../types'
import { logAuditEntry, AuditLogLevel } from './audit-logger'

/**
 * Quota warning thresholds
 */
export const WARNING_THRESHOLD_80 = 80
export const WARNING_THRESHOLD_90 = 90

/**
 * Quota warning level
 */
export enum QuotaWarningLevel {
  /** Warning at 80% of quota */
  WARNING_80 = 'warning_80',
  /** Warning at 90% of quota */
  WARNING_90 = 'warning_90',
}

/**
 * Quota warning result
 */
export interface QuotaWarningResult {
  projectId: string
  service: string
  warningLevel: QuotaWarningLevel
  currentUsage: number
  monthlyLimit: number
  usagePercentage: number
  resetAt: Date
  warningsSent: number
}

/**
 * Quota warning check result for a project
 */
export interface ProjectQuotaWarnings {
  projectId: string
  projectName: string
  warnings: Array<{
    service: string
    level: QuotaWarningLevel
    usagePercentage: number
    currentUsage: number
    monthlyLimit: number
    resetAt: Date
  }>
}

/**
 * Check if a warning should be sent based on usage percentage
 * Prevents duplicate warnings at the same level
 */
async function shouldSendWarning(
  pool: any,
  projectId: string,
  service: string,
  warningLevel: QuotaWarningLevel
): Promise<boolean> {
  try {
    // Get the start of the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Check if we've already sent this warning level this month
    const result = await pool.query(
      `
      SELECT id
      FROM notifications
      WHERE project_id = $1
        AND notification_type = 'quota_warning'
        AND data->>'service' = $2
        AND data->>'warning_level' = $3
        AND created_at >= $4
      `,
      [projectId, service, warningLevel, startOfMonth]
    )

    // If we've already sent this warning, don't send again
    return result.rows.length === 0
  } catch (error) {
    console.error('[QuotaWarnings] Error checking if warning should be sent:', error)
    // On error, allow the warning to be sent (fail open)
    return true
  }
}

/**
 * Create quota warning email content
 */
function createQuotaWarningEmail(
  projectName: string,
  service: string,
  warningLevel: QuotaWarningLevel,
  currentUsage: number,
  monthlyLimit: number,
  usagePercentage: number,
  resetAt: Date
): { subject: string; body: string } {
  const threshold = warningLevel === QuotaWarningLevel.WARNING_80 ? 80 : 90
  const urgency = warningLevel === QuotaWarningLevel.WARNING_90 ? 'URGENT' : 'IMPORTANT'

  const subject = `[${urgency}] Quota Warning: ${projectName} at ${usagePercentage}% of ${service} limit`

  const body = `
${urgency}: Your project is approaching its quota limit

Project: ${projectName}
Service: ${service}
Current Usage: ${currentUsage.toLocaleString()}
Monthly Limit: ${monthlyLimit.toLocaleString()}
Usage: ${usagePercentage}% (${threshold}% threshold reached)

What This Means:
Your project has used ${usagePercentage}% of its monthly ${service} quota.
If you exceed your quota, your project may be temporarily suspended.

Reset Date:
Your quota will reset on ${resetAt.toLocaleDateString()}

Recommended Actions:
1. Review your usage metrics in the developer dashboard
2. Identify the source of high ${service} usage
3. Optimize your application to reduce consumption
4. Consider upgrading your plan if you need more quota
5. Contact support if you need immediate assistance

Need Help?
If you believe this is an error or need assistance, please contact support.

---
This is an automated notification. Please do not reply directly to this email.
`.trim()

  return { subject, body }
}

/**
 * Send quota warning notification
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param service - Service name (e.g., db_queries, storage_mb)
 * @param warningLevel - Warning level (80% or 90%)
 * @param currentUsage - Current usage
 * @param monthlyLimit - Monthly limit
 * @param usagePercentage - Usage percentage
 * @param resetAt - When quota resets
 * @returns Number of notifications sent
 */
export async function sendQuotaWarning(
  projectId: string,
  projectName: string,
  service: string,
  warningLevel: QuotaWarningLevel,
  currentUsage: number,
  monthlyLimit: number,
  usagePercentage: number,
  resetAt: Date
): Promise<number> {
  const pool = getPool()
  const startTime = new Date()
  let success = false
  let deliveryCount = 0

  try {
    console.log(
      `[QuotaWarnings] Sending ${warningLevel} warning for project ${projectId}, service ${service}`
    )

    // Check if we should send this warning (prevent duplicates)
    const shouldSend = await shouldSendWarning(pool, projectId, service, warningLevel)
    if (!shouldSend) {
      console.log(
        `[QuotaWarnings] Warning ${warningLevel} already sent for ${service} this month, skipping`
      )
      return 0
    }

    // Create email content
    const { subject, body } = createQuotaWarningEmail(
      projectName,
      service,
      warningLevel,
      currentUsage,
      monthlyLimit,
      usagePercentage,
      resetAt
    )

    // Get notification recipients
    const recipients = await getNotificationRecipients(
      projectId,
      NotificationType.QUOTA_WARNING
    )

    if (recipients.length === 0) {
      console.warn(`[QuotaWarnings] No recipients found for project ${projectId}`)
      return 0
    }

    // Create notification record in database
    const notificationId = await createNotification(
      projectId,
      NotificationType.QUOTA_WARNING,
      warningLevel === QuotaWarningLevel.WARNING_90
        ? NotificationPriority.HIGH
        : NotificationPriority.MEDIUM,
      subject,
      body,
      {
        service,
        warning_level: warningLevel,
        current_usage: currentUsage,
        monthly_limit: monthlyLimit,
        usage_percentage: usagePercentage,
        reset_at: resetAt.toISOString(),
      },
      [NotificationChannel.EMAIL]
    )

    // Send notifications to all recipients
    let successCount = 0
    for (const recipient of recipients) {
      const result = await sendEmailNotification(recipient.email, subject, body)
      if (result.success) {
        successCount++
      }
    }

    deliveryCount = successCount
    success = successCount > 0

    console.log(
      `[QuotaWarnings] Sent ${warningLevel} warning to ${successCount}/${recipients.length} recipients`
    )

    return successCount
  } catch (error) {
    console.error('[QuotaWarnings] Error sending quota warning:', error)

    // Log failure to audit log
    await logAuditEntry({
      log_type: 'notification' as any,
      severity: AuditLogLevel.ERROR,
      project_id: projectId,
      action: 'Quota warning failed',
      details: {
        service,
        warning_level: warningLevel,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: new Date().getTime() - startTime.getTime(),
      },
      occurred_at: new Date(),
    }).catch((auditError) => {
      console.error('[QuotaWarnings] Failed to log audit entry:', auditError)
    })

    return 0
  } finally {
    // Log notification attempt to audit log
    if (success) {
      await logAuditEntry({
        log_type: 'notification' as any,
        severity: AuditLogLevel.INFO,
        project_id: projectId,
        action: 'Quota warning sent',
        details: {
          service,
          warning_level: warningLevel,
          delivery_count: deliveryCount,
          duration_ms: new Date().getTime() - startTime.getTime(),
        },
        occurred_at: new Date(),
      }).catch((auditError) => {
        console.error('[QuotaWarnings] Failed to log audit entry:', auditError)
      })
    }
  }
}

/**
 * Check quota usage and send warnings if thresholds are met
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param service - Service to check
 * @returns Warning result if warning was sent, null otherwise
 */
export async function checkAndSendQuotaWarning(
  projectId: string,
  projectName: string,
  service: string
): Promise<QuotaWarningResult | null> {
  const pool = getPool()

  try {
    // Get quota configuration
    const quotaResult = await pool.query(
      `
      SELECT monthly_limit, reset_at
      FROM control_plane.quotas
      WHERE project_id = $1 AND service = $2
      `,
      [projectId, service]
    )

    if (quotaResult.rows.length === 0) {
      // No quota configured for this service
      return null
    }

    const quota = quotaResult.rows[0]
    const monthlyLimit = quota.monthly_limit
    const resetAt = new Date(quota.reset_at)

    // Get current usage for the month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const usageResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) as total_usage
      FROM control_plane.usage_snapshots
      WHERE project_id = $1
        AND service = $2
        AND recorded_at >= $3
      `,
      [projectId, service, startOfMonth]
    )

    const currentUsage = parseFloat(usageResult.rows[0].total_usage) || 0
    const usagePercentage = monthlyLimit > 0 ? (currentUsage / monthlyLimit) * 100 : 0

    let warningLevel: QuotaWarningLevel | null = null

    // Check if we should send a 90% warning
    if (usagePercentage >= WARNING_THRESHOLD_90) {
      warningLevel = QuotaWarningLevel.WARNING_90
    }
    // Check if we should send an 80% warning
    else if (usagePercentage >= WARNING_THRESHOLD_80) {
      warningLevel = QuotaWarningLevel.WARNING_80
    }

    if (warningLevel) {
      const warningsSent = await sendQuotaWarning(
        projectId,
        projectName,
        service,
        warningLevel,
        currentUsage,
        monthlyLimit,
        Math.round(usagePercentage * 10) / 10,
        resetAt
      )

      if (warningsSent > 0) {
        return {
          projectId,
          service,
          warningLevel,
          currentUsage,
          monthlyLimit,
          usagePercentage: Math.round(usagePercentage * 10) / 10,
          resetAt,
          warningsSent,
        }
      }
    }

    return null
  } catch (error) {
    console.error('[QuotaWarnings] Error checking quota warning:', error)
    return null
  }
}

/**
 * Check all services for a project and send warnings if needed
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @returns Array of warning results
 */
export async function checkAllServicesForQuotaWarnings(
  projectId: string,
  projectName: string
): Promise<QuotaWarningResult[]> {
  const services = ['db_queries', 'storage_mb', 'realtime_connections', 'function_invocations', 'auth_users']
  const warnings: QuotaWarningResult[] = []

  for (const service of services) {
    try {
      const result = await checkAndSendQuotaWarning(projectId, projectName, service)
      if (result) {
        warnings.push(result)
      }
    } catch (error) {
      console.error(`[QuotaWarnings] Error checking service ${service}:`, error)
    }
  }

  return warnings
}

/**
 * Get all quota warnings for a project (for dashboard display)
 *
 * @param projectId - Project ID
 * @returns Array of active warnings
 */
export async function getProjectQuotaWarnings(
  projectId: string
): Promise<ProjectQuotaWarnings | null> {
  const pool = getPool()

  try {
    // Get project details
    const projectResult = await pool.query(
      'SELECT project_name FROM projects WHERE id = $1',
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return null
    }

    const projectName = projectResult.rows[0].project_name

    // Get quota configurations
    const quotasResult = await pool.query(
      `
      SELECT service, monthly_limit, reset_at
      FROM control_plane.quotas
      WHERE project_id = $1
      `,
      [projectId]
    )

    if (quotasResult.rows.length === 0) {
      return { projectId, projectName, warnings: [] }
    }

    const warnings: ProjectQuotaWarnings['warnings'] = []
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    for (const quota of quotasResult.rows) {
      // Get current usage for this service
      const usageResult = await pool.query(
        `
        SELECT COALESCE(SUM(amount), 0) as total_usage
        FROM control_plane.usage_snapshots
        WHERE project_id = $1
          AND service = $2
          AND recorded_at >= $3
        `,
        [projectId, quota.service, startOfMonth]
      )

      const currentUsage = parseFloat(usageResult.rows[0].total_usage) || 0
      const usagePercentage =
        quota.monthly_limit > 0 ? (currentUsage / quota.monthly_limit) * 100 : 0

      // Check if we're at or above warning thresholds
      if (usagePercentage >= WARNING_THRESHOLD_80) {
        const level =
          usagePercentage >= WARNING_THRESHOLD_90
            ? QuotaWarningLevel.WARNING_90
            : QuotaWarningLevel.WARNING_80

        warnings.push({
          service: quota.service,
          level,
          usagePercentage: Math.round(usagePercentage * 10) / 10,
          currentUsage,
          monthlyLimit: quota.monthly_limit,
          resetAt: new Date(quota.reset_at),
        })
      }
    }

    return { projectId, projectName, warnings }
  } catch (error) {
    console.error('[QuotaWarnings] Error getting project quota warnings:', error)
    return null
  }
}

/**
 * Background job to check all projects for quota warnings
 *
 * This function is designed to be called by a scheduled job/cron.
 * It checks all projects and sends warnings if they approach quota limits.
 *
 * @returns Summary of warnings sent
 */
export async function checkAllProjectsForQuotaWarnings(): Promise<{
  projectsChecked: number
  warningsSent: number
  servicesChecked: number
}> {
  const pool = getPool()

  try {
    console.log('[QuotaWarnings] Starting quota warning check for all projects')

    // Get all active projects
    const projectsResult = await pool.query(
      `
      SELECT id, project_name
      FROM projects
      WHERE status = 'active'
      `
    )

    const projects = projectsResult.rows
    console.log(`[QuotaWarnings] Checking ${projects.length} active projects`)

    let warningsSent = 0
    let servicesChecked = 0

    // Check each project
    for (const project of projects) {
      try {
        const projectWarnings = await checkAllServicesForQuotaWarnings(
          project.id,
          project.project_name
        )
        warningsSent += projectWarnings.length
        servicesChecked += 5 // 5 services checked per project
      } catch (error) {
        console.error(
          `[QuotaWarnings] Error checking project ${project.id}:`,
          error
        )
      }
    }

    console.log(
      `[QuotaWarnings] Quota warning check complete. Checked ${servicesChecked} services across ${projects.length} projects. Sent ${warningsSent} warnings.`
    )

    return {
      projectsChecked: projects.length,
      warningsSent,
      servicesChecked,
    }
  } catch (error) {
    console.error('[QuotaWarnings] Error checking all projects for quota warnings:', error)
    throw new Error('Failed to check projects for quota warnings')
  }
}
