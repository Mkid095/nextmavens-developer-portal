/**
 * Log Retention Background Job
 *
 * Provides the library function for automatically deleting old logs.
 * This is designed to be called by a cron job or scheduler (daily).
 *
 * Usage:
 * - Call runLogRetentionJob() from a cron job (e.g., every day at midnight)
 * - The function will delete logs older than the retention period (default 30 days)
 * - Results are logged for monitoring and debugging
 *
 * US-009: Implement Log Retention
 */

import { getPool } from '@/lib/db'

/**
 * Number of days to retain logs by default
 */
export const DEFAULT_RETENTION_DAYS = 30

/**
 * Background job result interface
 */
export interface LogRetentionJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Cutoff date - logs older than this were deleted */
  cutoffDate: Date
  /** Number of logs deleted */
  logsDeleted: number
  /** Number of projects affected */
  projectsAffected: number
  /** Details of affected projects */
  affectedProjects: Array<{
    projectId: string
    logsDeleted: number
  }>
  /** Error message if job failed */
  error?: string
}

/**
 * Log retention statistics
 */
export interface LogRetentionStats {
  /** Total number of logs in the system */
  totalLogs: number
  /** Number of logs that would be deleted */
  logsToDelete: number
  /** Number of projects affected */
  projectsAffected: number
  /** Cutoff date for retention */
  cutoffDate: Date
  /** Oldest log timestamp */
  oldestLog?: Date
  /** Newest log timestamp */
  newestLog?: Date
}

/**
 * Run the log retention background job
 *
 * This function deletes logs older than the retention period.
 * Logs are grouped by project_id for reporting purposes.
 *
 * @param retentionDays - Number of days to retain logs (default: 30)
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runLogRetentionJob();
 * console.log(`Job completed: ${result.logsDeleted} logs deleted`);
 */
export async function runLogRetentionJob(
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<LogRetentionJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Log Retention Job] Started at ${startTime.toISOString()}`)
  console.log(`[Log Retention Job] Retention period: ${retentionDays} days`)
  console.log('='.repeat(60))

  const pool = getPool()

  try {
    // Calculate the cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    cutoffDate.setHours(0, 0, 0, 0) // Start of the day

    console.log(`[Log Retention Job] Cutoff date: ${cutoffDate.toISOString()}`)

    // First, get statistics about what will be deleted (grouped by project)
    const statsResult = await pool.query(`
      SELECT
        project_id,
        COUNT(*) as log_count
      FROM control_plane.project_logs
      WHERE timestamp < $1
      GROUP BY project_id
      ORDER BY log_count DESC
    `, [cutoffDate])

    const affectedProjects: Array<{
      projectId: string
      logsDeleted: number
    }> = statsResult.rows.map((row) => ({
      projectId: row.project_id,
      logsDeleted: parseInt(row.log_count, 10),
    }))

    const projectsAffected = affectedProjects.length
    const logsToDelete = affectedProjects.reduce((sum, p) => sum + p.logsDeleted, 0)

    if (logsToDelete === 0) {
      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()

      console.log('='.repeat(60))
      console.log(`[Log Retention Job] Completed - No logs to delete`)
      console.log(`[Log Retention Job] Duration: ${durationMs}ms`)
      console.log('='.repeat(60))

      return {
        success: true,
        startedAt: startTime,
        completedAt: endTime,
        durationMs,
        cutoffDate,
        logsDeleted: 0,
        projectsAffected: 0,
        affectedProjects: [],
      }
    }

    console.log(`[Log Retention Job] Found ${logsToDelete} logs to delete from ${projectsAffected} projects`)

    // Delete old logs
    const deleteResult = await pool.query(`
      DELETE FROM control_plane.project_logs
      WHERE timestamp < $1
    `, [cutoffDate])

    const logsDeleted = deleteResult.rowCount || 0

    // Log details for each affected project
    console.log(`[Log Retention Job] Deleted ${logsDeleted} logs`)

    if (affectedProjects.length > 0) {
      console.log(`[Log Retention Job] Affected projects:`)
      affectedProjects.forEach((project, index) => {
        console.log(
          `  ${index + 1}. Project ${project.projectId} - ${project.logsDeleted} logs deleted`
        )
      })
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log('='.repeat(60))
    console.log(`[Log Retention Job] Completed`)
    console.log(`[Log Retention Job] Duration: ${durationMs}ms`)
    console.log(`[Log Retention Job] Logs deleted: ${logsDeleted}`)
    console.log(`[Log Retention Job] Projects affected: ${projectsAffected}`)
    console.log('='.repeat(60))

    return {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      cutoffDate,
      logsDeleted,
      projectsAffected,
      affectedProjects,
    }
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Log Retention Job] Failed`)
    console.error(`[Log Retention Job] Duration: ${durationMs}ms`)
    console.error(`[Log Retention Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      cutoffDate: new Date(),
      logsDeleted: 0,
      projectsAffected: 0,
      affectedProjects: [],
      error: errorMessage,
    }
  }
}

/**
 * Get log retention statistics without performing deletion
 *
 * This function returns statistics about the current state of logs
 * and how many would be deleted if the retention job ran.
 *
 * @param retentionDays - Number of days to retain logs (default: 30)
 * @returns Statistics about log retention
 *
 * @example
 * // Check what would be deleted
 * const stats = await getLogRetentionStats();
 * console.log(`Would delete ${stats.logsToDelete} of ${stats.totalLogs} logs`);
 */
export async function getLogRetentionStats(
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<LogRetentionStats> {
  const pool = getPool()

  // Calculate the cutoff date
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  cutoffDate.setHours(0, 0, 0, 0) // Start of the day

  try {
    // Get total log count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count FROM control_plane.project_logs
    `)
    const totalLogs = parseInt(totalResult.rows[0].count, 10)

    // Get logs to delete count (grouped by project for affected count)
    const deleteStatsResult = await pool.query(`
      SELECT
        project_id,
        COUNT(*) as log_count
      FROM control_plane.project_logs
      WHERE timestamp < $1
      GROUP BY project_id
    `, [cutoffDate])

    const projectsAffected = deleteStatsResult.rows.length
    const logsToDelete = deleteStatsResult.rows.reduce(
      (sum, row) => sum + parseInt(row.log_count, 10),
      0
    )

    // Get oldest and newest log timestamps
    const timestampResult = await pool.query(`
      SELECT
        MIN(timestamp) as oldest,
        MAX(timestamp) as newest
      FROM control_plane.project_logs
    `)

    const oldestLog = timestampResult.rows[0].oldest
      ? new Date(timestampResult.rows[0].oldest)
      : undefined
    const newestLog = timestampResult.rows[0].newest
      ? new Date(timestampResult.rows[0].newest)
      : undefined

    return {
      totalLogs,
      logsToDelete,
      projectsAffected,
      cutoffDate,
      oldestLog,
      newestLog,
    }
  } catch (error) {
    console.error('[Log Retention Stats] Error:', error)
    throw error
  }
}
