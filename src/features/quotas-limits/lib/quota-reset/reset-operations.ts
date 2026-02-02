/**
 * Quota Reset Operations
 *
 * Provides database operations for resetting quotas and managing usage snapshots.
 * US-008: Implement Quota Reset
 */

import { getPool } from '@/lib/db'
import { unsuspendProject } from '@/features/abuse-controls/lib/suspensions'
import type { QuotaToReset } from '../quota-reset-job'

/**
 * Database row for quota query results
 */
interface QuotaRow {
  project_id: string
  project_name: string
  project_slug: string
  owner_id: string
  owner_email: string
  service: string
  monthly_limit: number
  hard_cap: number
  reset_at: Date
}

/**
 * Get all quotas that need to be reset (reset_at <= NOW())
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

    return result.rows.map((row: QuotaRow) => ({
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

/**
 * Reset quota dates to next month
 *
 * Updates reset_at to the next month for all provided quotas.
 * Uses a transaction to ensure all updates succeed or fail together.
 *
 * @param quotas - Array of quotas to reset
 * @param getNextResetDate - Function to calculate next reset date
 * @returns Array of reset quota records
 */
export async function resetQuotaDates(
  quotas: QuotaRow[],
  getNextResetDate: (date: Date) => Date
): Promise<QuotaToReset[]> {
  const pool = getPool()
  const quotasReset: QuotaToReset[] = []

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    for (const quota of quotas) {
      const nextResetDate = getNextResetDate(new Date(quota.reset_at))

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

  return quotasReset
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
export async function archiveOldUsageSnapshots(retentionMonths: number = 3): Promise<number> {
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
 * Auto-resume manually suspended projects after quota reset
 *
 * Finds all suspended projects with manual suspension type and resumes them.
 * This is part of US-010: Auto-resume manually suspended projects.
 *
 * @returns Number of projects resumed
 */
export async function autoResumeSuspendedProjects(): Promise<number> {
  const pool = getPool()
  let projectsResumed = 0

  try {
    const suspendedProjectsResult = await pool.query(`
      SELECT
        s.id,
        s.project_id,
        p.name as project_name,
        s.suspension_type
      FROM control_plane.suspensions s
      INNER JOIN control_plane.projects p ON s.project_id = p.id
      WHERE s.resolved_at IS NULL
        AND s.suspension_type = 'manual'
        AND p.status = 'suspended'
    `)

    const manuallySuspendedProjects = suspendedProjectsResult.rows
    console.log(`[Quota Reset Job] Found ${manuallySuspendedProjects.length} manually suspended projects to auto-resume`)

    for (const project of manuallySuspendedProjects) {
      try {
        await unsuspendProject(project.project_id, 'Auto-resumed after quota reset (manual suspension)')
        projectsResumed++
        console.log(`[Quota Reset Job] Auto-resumed project ${project.project_name} (${project.project_id})`)
      } catch (error) {
        console.error(`[Quota Reset Job] Failed to auto-resume project ${project.project_id}:`, error)
      }
    }
  } catch (error) {
    console.error('[Quota Reset Job] Error auto-resuming suspended projects:', error)
  }

  return projectsResumed
}

/**
 * Database row for quota query results (exported for use by job orchestration)
 */
export type { QuotaRow }
