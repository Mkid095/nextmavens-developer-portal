/**
 * Quota Reset Background Job
 *
 * Main orchestration for the quota reset job.
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
import { getNextMonthResetDate } from './calculation'
import { getQuotasNeedingReset, resetQuotaDates, archiveOldUsageSnapshots, autoResumeSuspendedProjects, type QuotaRow } from './reset-operations'
import { sendQuotaResetNotifications } from './notifications'
import type { QuotaToReset } from '../quota-reset-job'

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
  /** Number of projects auto-resumed (manual suspensions only) */
  projectsResumed: number
  /** Error message if job failed */
  error?: string
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
    // Get raw quota rows from database
    const quotaRows = await getQuotasNeedingReset()
    const quotasChecked = quotaRows.length

    if (quotasChecked === 0) {
      console.log('[Quota Reset Job] No quotas need resetting')

      // Still archive old snapshots even if no quotas to reset
      const snapshotsArchived = await archiveOldUsageSnapshots(retentionMonths)

      return buildJobResult({
        success: true,
        startTime,
        quotasChecked: 0,
        quotasReset: [],
        snapshotsArchived,
        notificationsSent: 0,
        notificationsFailed: 0,
        projectsResumed: 0,
      })
    }

    console.log(`[Quota Reset Job] Found ${quotasChecked} quotas to reset`)

    // Group quotas by project for efficient notification
    const quotasByProject = groupQuotasByProject(quotaRows)

    // Reset quotas and collect results
    const quotasReset = await resetQuotaDates(quotaRows, getNextMonthResetDate)

    // Send notifications (one per project, summarizing all services reset)
    const { sent: notificationsSent, failed: notificationsFailed } = await sendQuotaResetNotifications(
      quotasReset,
      quotasByProject,
      getNextMonthResetDate
    )

    // Archive old usage snapshots
    const snapshotsArchived = await archiveOldUsageSnapshots(retentionMonths)

    // Auto-resume manually suspended projects (US-010)
    const projectsResumed = await autoResumeSuspendedProjects()

    return buildJobResult({
      success: true,
      startTime,
      quotasChecked,
      quotasReset,
      snapshotsArchived,
      notificationsSent,
      notificationsFailed,
      projectsResumed,
    })
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
      projectsResumed: 0,
      error: errorMessage,
    }
  }
}

/**
 * Group quotas by project for efficient notification
 */
function groupQuotasByProject(quotaRows: QuotaRow[]): Map<string, QuotaToReset[]> {
  const quotasByProject = new Map<string, QuotaToReset[]>()

  for (const quota of quotaRows) {
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

  return quotasByProject
}

/**
 * Build job result object and log summary
 */
function buildJobResult(params: {
  success: boolean
  startTime: Date
  quotasChecked: number
  quotasReset: QuotaToReset[]
  snapshotsArchived: number
  notificationsSent: number
  notificationsFailed: number
  projectsResumed: number
}): QuotaResetJobResult {
  const endTime = new Date()
  const durationMs = endTime.getTime() - params.startTime.getTime()

  console.log('='.repeat(60))
  console.log(`[Quota Reset Job] Completed`)
  console.log(`[Quota Reset Job] Duration: ${durationMs}ms`)
  console.log(`[Quota Reset Job] Quotas checked: ${params.quotasChecked}`)
  console.log(`[Quota Reset Job] Quotas reset: ${params.quotasReset.length}`)
  console.log(`[Quota Reset Job] Snapshots archived: ${params.snapshotsArchived}`)
  console.log(`[Quota Reset Job] Notifications sent: ${params.notificationsSent}`)
  console.log(`[Quota Reset Job] Notifications failed: ${params.notificationsFailed}`)
  console.log(`[Quota Reset Job] Projects auto-resumed: ${params.projectsResumed}`)

  if (params.quotasReset.length > 0) {
    console.log(`[Quota Reset Job] Reset quotas:`)
    params.quotasReset.forEach((quota, index) => {
      console.log(
        `  ${index + 1}. ${quota.projectName} (${quota.projectSlug}) - ${quota.service} - next reset: ${getNextMonthResetDate(quota.resetAt).toISOString()}`
      )
    })
  }

  console.log('='.repeat(60))

  return {
    success: params.success,
    startedAt: params.startTime,
    completedAt: endTime,
    durationMs,
    quotasChecked: params.quotasChecked,
    quotasReset: params.quotasReset,
    snapshotsArchived: params.snapshotsArchived,
    notificationsSent: params.notificationsSent,
    notificationsFailed: params.notificationsFailed,
    projectsResumed: params.projectsResumed,
  }
}
