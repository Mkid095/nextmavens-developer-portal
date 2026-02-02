/**
 * Error Rate Detection Background Job
 * Main background job for detecting high error rates across all projects
 */

import { getPool } from '@/lib/db'
import type { ErrorRateDetectionJobResult } from './types'
import type { ErrorRateDetectionResult } from '../types'
import { ErrorRateAction } from '../types'
import { checkAllProjectsForHighErrorRates } from './detection'
import { logBackgroundJob } from '../audit-logger'

/**
 * Run the error rate detection background job
 *
 * This function checks all active projects for high error rates
 * and logs the results for monitoring and debugging.
 *
 * @returns Result object with job statistics and detected error rates
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runErrorRateDetection();
 * console.log(`Job completed: ${result.errorRatesDetected} high error rates detected`);
 */
export async function runErrorRateDetection(): Promise<ErrorRateDetectionJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Error Rate Detection] Background job started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  try {
    // Run the error rate detection
    const detectedErrorRates = await checkAllProjectsForHighErrorRates()

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    // Count actions recommended
    const warnings = detectedErrorRates.filter((r) => r.recommendedAction === ErrorRateAction.WARNING).length
    const investigations = detectedErrorRates.filter((r) => r.recommendedAction === ErrorRateAction.INVESTIGATE).length

    // Count projects checked
    const pool = getPool()
    const projectsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'active'
      `
    )
    const projectsChecked = parseInt(projectsResult.rows[0].count)

    const result: ErrorRateDetectionJobResult = {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      errorRatesDetected: detectedErrorRates.length,
      detectedErrorRates,
      actionsTaken: {
        warnings,
        investigations,
      },
    }

    // Log summary
    console.log('='.repeat(60))
    console.log(`[Error Rate Detection] Background job completed`)
    console.log(`[Error Rate Detection] Duration: ${durationMs}ms`)
    console.log(`[Error Rate Detection] Projects checked: ${result.projectsChecked}`)
    console.log(`[Error Rate Detection] High error rates detected: ${result.errorRatesDetected}`)
    console.log(`[Error Rate Detection] Actions recommended:`)
    console.log(`  - Warnings: ${result.actionsTaken.warnings}`)
    console.log(`  - Investigations: ${result.actionsTaken.investigations}`)

    if (result.errorRatesDetected > 0) {
      console.log(`[Error Rate Detection] Detected high error rates:`)
      detectedErrorRates.forEach((detection, index) => {
        console.log(
          `  ${index + 1}. Project ${detection.projectId} - ${detection.errorRate}% error rate (${detection.totalRequests} requests, ${detection.errorCount} errors) - Severity: ${detection.severity.toUpperCase()}`
        )
      })
    }

    console.log('='.repeat(60))

    // Log the background job execution to audit logs
    await logBackgroundJob(
      'error_rate_detection',
      true,
      {
        duration_ms: durationMs,
        projects_checked: result.projectsChecked,
        error_rates_detected: result.errorRatesDetected,
        warnings: result.actionsTaken.warnings,
        investigations: result.actionsTaken.investigations,
        detected_error_rates: detectedErrorRates.map((r) => ({
          project_id: r.projectId,
          error_rate: r.errorRate,
          severity: r.severity,
          total_requests: r.totalRequests,
          error_count: r.errorCount,
        })),
      }
    ).catch((error) => {
      // Don't fail the job if logging fails
      console.error('[Error Rate Detection] Failed to log to audit:', error)
    })

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Error Rate Detection] Background job failed`)
    console.error(`[Error Rate Detection] Duration: ${durationMs}ms`)
    console.error(`[Error Rate Detection] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    // Log the failed background job execution to audit logs
    await logBackgroundJob(
      'error_rate_detection',
      false,
      {
        duration_ms: durationMs,
        error: errorMessage,
      }
    ).catch((logError) => {
      // Don't fail if logging fails
      console.error('[Error Rate Detection] Failed to log to audit:', logError)
    })

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      errorRatesDetected: 0,
      detectedErrorRates: [],
      actionsTaken: {
        warnings: 0,
        investigations: 0,
      },
      error: errorMessage,
    }
  }
}
