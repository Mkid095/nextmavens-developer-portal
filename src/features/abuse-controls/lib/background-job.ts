/**
 * Background Job Runner
 *
 * Provides the library function for running suspension checks.
 * This is designed to be called by a cron job or scheduler (not the cron job itself).
 *
 * Usage:
 * - Call runSuspensionCheck() from a cron job (e.g., every hour)
 * - The function will check all projects and suspend those exceeding caps
 * - Results are logged for monitoring and debugging
 */

import { checkAllProjectsForSuspension } from './suspensions'
import { logBackgroundJob } from './audit-logger'

/**
 * Background job result interface
 */
export interface BackgroundJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of projects checked */
  projectsChecked: number
  /** Number of projects suspended */
  suspensionsMade: number
  /** Details of suspended projects */
  suspendedProjects: Array<{
    projectId: string
    capExceeded: string
    suspendedAt: Date
  }>
  /** Error message if job failed */
  error?: string
}

/**
 * Run the suspension check background job
 *
 * This function checks all active projects against their hard caps
 * and suspends any projects that have exceeded their limits.
 *
 * It includes comprehensive logging for monitoring and debugging.
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runSuspensionCheck();
 * console.log(`Job completed: ${result.suspensionsMade} suspensions made`);
 */
export async function runSuspensionCheck(): Promise<BackgroundJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Background Job] Suspension check started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  try {
    // Run the suspension check
    const suspendedRecords = await checkAllProjectsForSuspension()

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    // Extract project details for logging
    const suspendedProjects = suspendedRecords.map((record) => ({
      projectId: record.project_id,
      capExceeded: record.cap_exceeded,
      suspendedAt: record.suspended_at,
    }))

    const result: BackgroundJobResult = {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0, // Will be populated by checkAllProjectsForSuspension
      suspensionsMade: suspendedRecords.length,
      suspendedProjects,
    }

    // Log summary
    console.log('='.repeat(60))
    console.log(`[Background Job] Suspension check completed`)
    console.log(`[Background Job] Duration: ${durationMs}ms`)
    console.log(`[Background Job] Suspensions made: ${result.suspensionsMade}`)

    if (result.suspensionsMade > 0) {
      console.log(`[Background Job] Suspended projects:`)
      suspendedProjects.forEach((project, index) => {
        console.log(
          `  ${index + 1}. Project ${project.projectId} - Exceeded ${project.capExceeded}`
        )
      })
    }

    console.log('='.repeat(60))

    // Log the background job execution to audit logs
    await logBackgroundJob(
      'suspension_check',
      true,
      {
        duration_ms: durationMs,
        projects_checked: result.projectsChecked,
        suspensions_made: result.suspensionsMade,
        suspended_projects: suspendedProjects.map((p) => ({
          project_id: p.projectId,
          cap_exceeded: p.capExceeded,
        })),
      }
    ).catch((error) => {
      // Don't fail the job if logging fails
      console.error('[Background Job] Failed to log to audit:', error)
    })

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Background Job] Suspension check failed`)
    console.error(`[Background Job] Duration: ${durationMs}ms`)
    console.error(`[Background Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    // Log the failed background job execution to audit logs
    await logBackgroundJob(
      'suspension_check',
      false,
      {
        duration_ms: durationMs,
        error: errorMessage,
      }
    ).catch((logError) => {
      // Don't fail if logging fails
      console.error('[Background Job] Failed to log to audit:', logError)
    })

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      suspensionsMade: 0,
      suspendedProjects: [],
      error: errorMessage,
    }
  }
}

/**
 * Get a summary of recent suspension activity
 *
 * @param hours - Number of hours to look back (default: 24)
 * @returns Summary of suspensions in the time period
 */
export async function getSuspensionSummary(hours: number = 24): Promise<{
  totalSuspensions: number
  byCapType: Record<string, number>
  activeSuspensions: number
}> {
  // This is a placeholder for now
  // Would query suspension_history to get statistics
  // Implementation can be added when monitoring dashboard is needed

  return {
    totalSuspensions: 0,
    byCapType: {},
    activeSuspensions: 0,
  }
}
