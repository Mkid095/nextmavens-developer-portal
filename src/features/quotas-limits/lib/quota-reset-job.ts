/**
 * Quota Reset Background Job
 *
 * Provides the library function for managing monthly quota resets.
 * This is designed to be called by a cron job or scheduler (daily or monthly).
 *
 * Usage:
 * - Call runQuotaResetJob() from a cron job (e.g., on the 1st of each month)
 * - The function will:
 *   1. Find quotas that need to be reset (reset_at <= NOW())
 *   2. Update reset_at to next month for those quotas
 *   3. Archive usage snapshots older than the reset period
 *   4. Send notifications to project owners about quota reset
 * - Results are logged for monitoring and debugging
 *
 * US-008: Implement Quota Reset
 */

import { getPool } from '@/lib/db'
import { sendHtmlEmail } from '@/features/abuse-controls/lib/email-service'

/**
 * Quota that needs to be reset
 */
export interface QuotaToReset {
  projectId: string
  projectName: string
  projectSlug: string
  ownerId: string
  ownerEmail: string
  service: string
  monthlyLimit: number
  hardCap: number
  resetAt: Date
}

/**
 * Background job result interface
 */
export interface QuotaResetJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of quotas checked */
  quotasChecked: number
  /** Quotas that were reset */
  quotasReset: QuotaToReset[]
  /** Number of usage snapshots archived */
  snapshotsArchived: number
  /** Number of notifications sent successfully */
  notificationsSent: number
  /** Number of notifications that failed */
  notificationsFailed: number
  /** Error message if job failed */
  error?: string
}

/**
 * Calculate the next month's reset date
 * Keeps the same day of month, or last day of next month if current day is last day
 */
function getNextMonthResetDate(currentReset: Date): Date {
  const nextReset = new Date(currentReset)

  // Move to next month
  nextReset.setMonth(nextReset.getMonth() + 1)

  // If the current day was the last day of the month, ensure we stay on last day
  const currentResetCopy = new Date(currentReset)
  const isLastDayOfMonth = currentResetCopy.getMonth() !== new Date(currentResetCopy.getFullYear(), currentResetCopy.getMonth() + 1, 0).getDate()

  if (isLastDayOfMonth) {
    // Set to last day of next month
    const lastDayOfNextMonth = new Date(nextReset.getFullYear(), nextReset.getMonth() + 1, 0)
    nextReset.setDate(lastDayOfNextMonth.getDate())
  }

  return nextReset
}

/**
 * Send quota reset notification email to project owner
 */
async function sendQuotaResetNotification(
  projectName: string,
  service: string,
  monthlyLimit: number,
  nextResetDate: Date,
  ownerEmail: string
): Promise<{ success: boolean; error?: string }> {
  const formattedService = service.replace(/_/g, ' ').toUpperCase()
  const formattedDate = nextResetDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quota Reset - ${projectName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
        .container { background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        h1 { color: #111827; margin-top: 0; font-size: 24px; font-weight: 600; }
        .highlight { background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .info-box { background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin: 20px 0; }
        .label { font-weight: 600; color: #374151; }
        .value { color: #6b7280; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .badge { display: inline-block; background-color: #10b981; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; margin-left: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Quota Reset Complete <span class="badge">MONTHLY</span></h1>

        <p>Hi there,</p>

        <p>Your monthly quota has been reset for project <strong>${projectName}</strong>.</p>

        <div class="highlight">
          <p style="margin: 0;"><strong>${formattedService}</strong> quota has been refreshed and you now have your full monthly allowance of <strong>${monthlyLimit.toLocaleString()}</strong> units available.</p>
        </div>

        <div class="info-box">
          <p class="label">Next Reset Date</p>
          <p class="value">${formattedDate}</p>
        </div>

        <p>You can view your current usage and quota status in your project dashboard.</p>

        <div class="footer">
          <p style="margin: 0;">This is an automated notification. You're receiving this because you're the owner of project <strong>${projectName}</strong>.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Quota Reset Complete - ${projectName}

    Hi there,

    Your monthly quota has been reset for project "${projectName}".

    ${formattedService} quota has been refreshed and you now have your full monthly allowance of ${monthlyLimit.toLocaleString()} units available.

    Next Reset Date: ${formattedDate}

    You can view your current usage and quota status in your project dashboard.

    ---
    This is an automated notification. You're receiving this because you're the owner of project "${projectName}".
  `

  try {
    const result = await sendHtmlEmail(
      ownerEmail,
      `Monthly Quota Reset - ${projectName}`,
      html,
      text
    )

    if (result.success) {
      console.log(`[Quota Reset Job] Sent notification to ${ownerEmail.slice(0, 3)}***`)
      return { success: true }
    } else {
      console.error(`[Quota Reset Job] Failed to send notification to ${ownerEmail.slice(0, 3)}***: ${result.error}`)
      return { success: false, error: result.error }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Quota Reset Job] Error sending notification: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

/**
 * Archive old usage snapshots
 *
 * Deletes usage snapshots older than the specified retention period.
 * This prevents the usage_snapshots table from growing indefinitely.
 *
 * @param retentionMonths - Number of months to retain snapshots (default: 3)
 * @returns Number of snapshots deleted
 */
async function archiveOldUsageSnapshots(retentionMonths: number = 3): Promise<number> {
  const pool = getPool()

  try {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths)

    const result = await pool.query(
      `
      DELETE FROM control_plane.usage_snapshots
      WHERE recorded_at < $1
      `,
      [cutoffDate]
    )

    const deletedCount = result.rowCount || 0
    console.log(`[Quota Reset Job] Archived ${deletedCount} usage snapshots (older than ${retentionMonths} months)`)

    return deletedCount
  } catch (error) {
    console.error('[Quota Reset Job] Error archiving usage snapshots:', error)
    return 0
  }
}

/**
 * Run the quota reset background job
 *
 * This function:
 * 1. Finds quotas whose reset_at date has passed (reset_at <= NOW())
 * 2. Updates reset_at to next month for those quotas
 * 3. Archives usage snapshots older than retention period
 * 4. Sends notification emails to project owners
 *
 * @param retentionMonths - Number of months of usage snapshots to retain (default: 3)
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runQuotaResetJob();
 * console.log(`Job completed: ${result.quotasReset.length} quotas reset`);
 */
export async function runQuotaResetJob(retentionMonths: number = 3): Promise<QuotaResetJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Quota Reset Job] Started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  const pool = getPool()

  try {
    // Find all quotas that need to be reset (reset_at <= NOW())
    const quotasResult = await pool.query(`
      SELECT
        q.project_id,
        p.name as project_name,
        p.slug as project_slug,
        p.owner_id,
        u.email as owner_email,
        q.service,
        q.monthly_limit,
        q.hard_cap,
        q.reset_at
      FROM control_plane.quotas q
      INNER JOIN control_plane.projects p ON q.project_id = p.id
      INNER JOIN control_plane.users u ON p.owner_id = u.id
      WHERE q.reset_at <= NOW()
      ORDER BY q.reset_at ASC
    `)

    const quotas = quotasResult.rows
    const quotasChecked = quotas.length

    if (quotasChecked === 0) {
      console.log('[Quota Reset Job] No quotas need resetting')

      // Still archive old snapshots even if no quotas to reset
      const snapshotsArchived = await archiveOldUsageSnapshots(retentionMonths)

      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()

      console.log('='.repeat(60))
      console.log(`[Quota Reset Job] Completed - No quotas to reset`)
      console.log(`[Quota Reset Job] Duration: ${durationMs}ms`)
      console.log(`[Quota Reset Job] Snapshots archived: ${snapshotsArchived}`)
      console.log('='.repeat(60))

      return {
        success: true,
        startedAt: startTime,
        completedAt: endTime,
        durationMs,
        quotasChecked: 0,
        quotasReset: [],
        snapshotsArchived,
        notificationsSent: 0,
        notificationsFailed: 0,
      }
    }

    console.log(`[Quota Reset Job] Found ${quotasChecked} quotas to reset`)

    // Group quotas by project for efficient notification
    const quotasByProject = new Map<string, QuotaToReset[]>()

    for (const quota of quotas) {
      const quotaToReset: QuotaToReset = {
        projectId: quota.project_id,
        projectName: quota.project_name,
        projectSlug: quota.project_slug,
        ownerId: quota.owner_id,
        ownerEmail: quota.owner_email,
        service: quota.service,
        monthlyLimit: quota.monthly_limit,
        hardCap: quota.hard_cap,
        resetAt: new Date(quota.reset_at),
      }

      if (!quotasByProject.has(quota.project_id)) {
        quotasByProject.set(quota.project_id, [])
      }
      quotasByProject.get(quota.project_id)!.push(quotaToReset)
    }

    // Reset quotas and collect results
    const quotasReset: QuotaToReset[] = []
    let notificationsSent = 0
    let notificationsFailed = 0

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      for (const quota of quotas) {
        const nextResetDate = getNextMonthResetDate(new Date(quota.reset_at))

        // Update reset_at to next month
        await client.query(
          `
          UPDATE control_plane.quotas
          SET reset_at = $1, updated_at = NOW()
          WHERE project_id = $2 AND service = $3
          `,
          [nextResetDate, quota.project_id, quota.service]
        )

        const quotaToReset: QuotaToReset = {
          projectId: quota.project_id,
          projectName: quota.project_name,
          projectSlug: quota.project_slug,
          ownerId: quota.owner_id,
          ownerEmail: quota.owner_email,
          service: quota.service,
          monthlyLimit: quota.monthly_limit,
          hardCap: quota.hard_cap,
          resetAt: new Date(quota.reset_at),
        }

        quotasReset.push(quotaToReset)
        console.log(`[Quota Reset Job] Reset quota for project ${quota.project_name} (${quota.project_slug}) - ${quota.service}`)
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    // Send notifications (one per project, summarizing all services reset)
    const notifiedProjects = new Set<string>()

    for (const quota of quotasReset) {
      if (notifiedProjects.has(quota.projectId)) {
        continue // Already sent notification for this project
      }

      const nextResetDate = getNextMonthResetDate(quota.resetAt)
      const projectQuotas = quotasByProject.get(quota.projectId)!

      // Send notification for the first service of the project
      // (The email summarizes the reset, including the monthly limit)
      const notificationResult = await sendQuotaResetNotification(
        quota.projectName,
        quota.service,
        quota.monthlyLimit,
        nextResetDate,
        quota.ownerEmail
      )

      if (notificationResult.success) {
        notificationsSent++
      } else {
        notificationsFailed++
      }

      notifiedProjects.add(quota.projectId)
    }

    // Archive old usage snapshots
    const snapshotsArchived = await archiveOldUsageSnapshots(retentionMonths)

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log('='.repeat(60))
    console.log(`[Quota Reset Job] Completed`)
    console.log(`[Quota Reset Job] Duration: ${durationMs}ms`)
    console.log(`[Quota Reset Job] Quotas checked: ${quotasChecked}`)
    console.log(`[Quota Reset Job] Quotas reset: ${quotasReset.length}`)
    console.log(`[Quota Reset Job] Snapshots archived: ${snapshotsArchived}`)
    console.log(`[Quota Reset Job] Notifications sent: ${notificationsSent}`)
    console.log(`[Quota Reset Job] Notifications failed: ${notificationsFailed}`)

    if (quotasReset.length > 0) {
      console.log(`[Quota Reset Job] Reset quotas:`)
      quotasReset.forEach((quota, index) => {
        console.log(
          `  ${index + 1}. ${quota.projectName} (${quota.projectSlug}) - ${quota.service} - next reset: ${getNextMonthResetDate(quota.resetAt).toISOString()}`
        )
      })
    }

    console.log('='.repeat(60))

    return {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      quotasChecked,
      quotasReset,
      snapshotsArchived,
      notificationsSent,
      notificationsFailed,
    }
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Quota Reset Job] Failed`)
    console.error(`[Quota Reset Job] Duration: ${durationMs}ms`)
    console.error(`[Quota Reset Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      quotasChecked: 0,
      quotasReset: [],
      snapshotsArchived: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      error: errorMessage,
    }
  }
}

/**
 * Get quotas that need to be reset (without resetting them)
 *
 * This is useful for monitoring and dashboards to show which quotas
 * are approaching their reset date.
 *
 * @returns Array of quotas that need to be reset
 */
export async function getQuotasNeedingReset(): Promise<QuotaToReset[]> {
  const pool = getPool()

  try {
    const result = await pool.query(`
      SELECT
        q.project_id,
        p.name as project_name,
        p.slug as project_slug,
        p.owner_id,
        u.email as owner_email,
        q.service,
        q.monthly_limit,
        q.hard_cap,
        q.reset_at
      FROM control_plane.quotas q
      INNER JOIN control_plane.projects p ON q.project_id = p.id
      INNER JOIN control_plane.users u ON p.owner_id = u.id
      WHERE q.reset_at <= NOW()
      ORDER BY q.reset_at ASC
    `)

    return result.rows.map((row: any) => ({
      projectId: row.project_id,
      projectName: row.project_name,
      projectSlug: row.project_slug,
      ownerId: row.owner_id,
      ownerEmail: row.owner_email,
      service: row.service,
      monthlyLimit: row.monthly_limit,
      hardCap: row.hard_cap,
      resetAt: new Date(row.reset_at),
    }))
  } catch (error) {
    console.error('[Quota Reset Job] Error getting quotas needing reset:', error)
    return []
  }
}
