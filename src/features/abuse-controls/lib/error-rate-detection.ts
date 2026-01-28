/**
 * Error Rate Detection Library
 *
 * Detects high error rates that may indicate abuse, DDoS attacks, or system issues.
 * Calculates error rate as (error_count / total_requests) * 100.
 *
 * Usage:
 * - Call runErrorRateDetection() from a background job (e.g., every hour)
 * - The function will check all projects for high error rates
 * - Actions are taken based on error rate severity (warning or investigation)
 */

import { getPool } from '@/lib/db'
import { ErrorRateSeverity, ErrorRateAction } from '../types'
import type { ErrorRateDetectionResult } from '../types'
import {
  ERROR_RATE_THRESHOLD,
  ERROR_RATE_DETECTION_WINDOW_MS,
  MIN_REQUESTS_FOR_ERROR_RATE_DETECTION,
  DEFAULT_ERROR_RATE_ACTION_THRESHOLDS,
  determineErrorRateSeverity,
} from './config'
import { getErrorStatistics as getErrorStatsFromDb } from '../migrations/create-error-metrics-table'
import { logBackgroundJob } from './audit-logger'

/**
 * Calculate error rate for a project over a time period
 *
 * @param projectId - The project to analyze
 * @param startTime - Start of time period
 * @param endTime - End of time period
 * @returns Error rate percentage (0-100)
 */
export async function calculateErrorRate(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<number> {
  try {
    const result = await getErrorStatsFromDb(projectId, startTime, endTime)

    if (!result.success || !result.data) {
      console.warn(`[Error Rate Detection] No error data for project ${projectId}`)
      return 0
    }

    // Return error rate from the statistics
    return result.data.errorRate || 0
  } catch (error) {
    console.error('[Error Rate Detection] Error calculating error rate:', error)
    return 0
  }
}

/**
 * Detect if error rate exceeds the threshold
 *
 * @param projectId - The project to check
 * @param totalRequests - Total number of requests
 * @param errorCount - Number of errors
 * @param thresholdPercentage - Error rate threshold percentage (default: 50)
 * @returns Detection result with details
 */
export async function detectHighErrorRate(
  projectId: string,
  totalRequests: number,
  errorCount: number,
  thresholdPercentage: number = ERROR_RATE_THRESHOLD
): Promise<ErrorRateDetectionResult> {
  const now = new Date()

  // Calculate error rate
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

  // Determine severity
  const severityValue = determineErrorRateSeverity(errorRate)
  const severity =
    severityValue === 'severe'
      ? ErrorRateSeverity.SEVERE
      : severityValue === 'critical'
      ? ErrorRateSeverity.CRITICAL
      : ErrorRateSeverity.WARNING

  // Check if error rate threshold is exceeded
  const errorRateDetected =
    errorRate >= thresholdPercentage && totalRequests >= MIN_REQUESTS_FOR_ERROR_RATE_DETECTION

  // Determine action based on severity
  let recommendedAction: ErrorRateAction = ErrorRateAction.NONE
  if (errorRateDetected) {
    if (severity === ErrorRateSeverity.SEVERE || severity === ErrorRateSeverity.CRITICAL) {
      recommendedAction = ErrorRateAction.INVESTIGATE
    } else {
      recommendedAction = ErrorRateAction.WARNING
    }
  }

  return {
    projectId,
    errorRateDetected,
    errorRate: Number(errorRate.toFixed(2)),
    totalRequests,
    errorCount,
    severity,
    recommendedAction,
    detectedAt: now,
    details: errorRateDetected
      ? `High error rate detected: ${errorRate.toFixed(2)}% (${errorCount} errors out of ${totalRequests} requests)`
      : undefined,
  }
}

/**
 * Check a single project for high error rates
 *
 * @param projectId - The project to check
 * @returns Error rate detection result
 */
export async function checkProjectForHighErrorRate(
  projectId: string
): Promise<ErrorRateDetectionResult | null> {
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - ERROR_RATE_DETECTION_WINDOW_MS)

    // Get error statistics in the detection window
    const errorStatsResult = await getErrorStatsFromDb(projectId, windowStart, now)

    if (!errorStatsResult.success || !errorStatsResult.data) {
      console.warn(`[Error Rate Detection] No error data for project ${projectId}`)
      return null
    }

    const { totalRequests, totalErrors } = errorStatsResult.data

    // Skip if below minimum requests threshold
    if (totalRequests < MIN_REQUESTS_FOR_ERROR_RATE_DETECTION) {
      return null
    }

    // Detect high error rate
    const detectionResult = await detectHighErrorRate(projectId, totalRequests, totalErrors)

    if (detectionResult.errorRateDetected) {
      console.log(
        `[Error Rate Detection] High error rate detected for project ${projectId}: ${detectionResult.errorRate}% (${detectionResult.errorCount} errors out of ${detectionResult.totalRequests} requests) - Severity: ${detectionResult.severity.toUpperCase()}`
      )
    }

    return detectionResult
  } catch (error) {
    console.error(`[Error Rate Detection] Error checking project ${projectId}:`, error)
    return null
  }
}

/**
 * Check all projects for high error rates
 *
 * This function is designed to be called by a background job/cron.
 * It iterates through all active projects and checks for high error rates.
 *
 * @returns Array of all detected high error rates
 */
export async function checkAllProjectsForHighErrorRates(): Promise<ErrorRateDetectionResult[]> {
  const pool = getPool()

  try {
    console.log('[Error Rate Detection] Starting error rate check for all projects')

    // Get all active projects
    const projectsResult = await pool.query(
      `
      SELECT id, project_name
      FROM projects
      WHERE status = 'active'
      `
    )

    const projects = projectsResult.rows
    console.log(`[Error Rate Detection] Checking ${projects.length} active projects`)

    const allDetectedHighErrorRates: ErrorRateDetectionResult[] = []

    // Check each project for high error rates
    for (const project of projects) {
      const projectId = project.id

      try {
        const detectionResult = await checkProjectForHighErrorRate(projectId)

        if (detectionResult && detectionResult.errorRateDetected) {
          allDetectedHighErrorRates.push(detectionResult)
        }
      } catch (error) {
        console.error(
          `[Error Rate Detection] Error checking project ${projectId}:`,
          error
        )
        // Continue with next project
      }
    }

    console.log(
      `[Error Rate Detection] Error rate check complete. ${allDetectedHighErrorRates.length} high error rate(s) detected.`
    )

    return allDetectedHighErrorRates
  } catch (error) {
    console.error('[Error Rate Detection] Error checking all projects for high error rates:', error)
    throw new Error('Failed to check projects for high error rates')
  }
}

/**
 * Background job result interface
 */
export interface ErrorRateDetectionJobResult {
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
  /** Number of high error rates detected */
  errorRatesDetected: number
  /** Details of detected error rates */
  detectedErrorRates: ErrorRateDetectionResult[]
  /** Breakdown by action type */
  actionsTaken: {
    warnings: number
    investigations: number
  }
  /** Error message if job failed */
  error?: string
}

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

/**
 * Get error rate detection configuration
 *
 * @returns Current error rate detection configuration
 */
export function getErrorRateDetectionConfig(): {
  thresholdPercentage: number
  detectionWindowMs: number
  minRequestsForDetection: number
  actionThresholds: Array<{ minErrorRate: number; action: string }>
} {
  return {
    thresholdPercentage: ERROR_RATE_THRESHOLD,
    detectionWindowMs: ERROR_RATE_DETECTION_WINDOW_MS,
    minRequestsForDetection: MIN_REQUESTS_FOR_ERROR_RATE_DETECTION,
    actionThresholds: DEFAULT_ERROR_RATE_ACTION_THRESHOLDS.map((t) => ({
      minErrorRate: t.minErrorRate,
      action: t.action,
    })),
  }
}

/**
 * Get error rate detection history for a project
 *
 * Note: This is a placeholder. Actual history logging will be implemented
 * in a future migration with an error_rate_detections table similar to spike_detections.
 *
 * @param projectId - The project to get history for
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of detected high error rates in the time period
 */
export async function getErrorRateDetectionHistory(
  projectId: string,
  hours: number = 24
): Promise<ErrorRateDetectionResult[]> {
  // For now, this is a placeholder. In the future, we'll have an error_rate_detections table
  // similar to spike_detections for storing historical data.
  console.warn(`[Error Rate Detection] History not yet implemented for project ${projectId}`)
  return []
}

/**
 * Check a specific project for high error rates
 *
 * @param projectId - The project to check
 * @returns Detection result or null if no high error rate detected
 */
export async function checkProjectErrorRateStatus(
  projectId: string
): Promise<ErrorRateDetectionResult | null> {
  return checkProjectForHighErrorRate(projectId)
}

/**
 * Record error metrics for a project
 *
 * This function should be called periodically to record error metrics.
 * For now, this is a placeholder that will be integrated with actual
 * error tracking when implemented.
 *
 * @param projectId - The project to record metrics for
 * @param requestCount - The number of requests
 * @param errorCount - The number of errors
 */
export async function recordErrorMetrics(
  projectId: string,
  requestCount: number,
  errorCount: number
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO error_metrics (project_id, request_count, error_count)
      VALUES ($1, $2, $3)
      `,
      [projectId, requestCount, errorCount]
    )

    console.log(
      `[Error Rate Detection] Recorded metrics for project ${projectId}: ${requestCount} requests, ${errorCount} errors`
    )
  } catch (error) {
    console.error('[Error Rate Detection] Error recording error metrics:', error)
    throw new Error('Failed to record error metrics')
  }
}

/**
 * Get current error rate detection status for all projects
 *
 * @returns Summary of error rate detection status across all projects
 */
export async function getErrorRateDetectionSummary(): Promise<{
  totalProjects: number
  activeDetections: number
  recentInvestigations: number
  bySeverity: Record<string, number>
}> {
  const pool = getPool()

  try {
    // Get total active projects
    const projectsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'active'
      `
    )
    const totalProjects = parseInt(projectsResult.rows[0].count)

    // Note: These will be populated when we implement the error_rate_detections table
    const activeDetections = 0
    const recentInvestigations = 0
    const bySeverity: Record<string, number> = {
      warning: 0,
      critical: 0,
      severe: 0,
    }

    return {
      totalProjects,
      activeDetections,
      recentInvestigations,
      bySeverity,
    }
  } catch (error) {
    console.error('[Error Rate Detection] Error getting summary:', error)
    return {
      totalProjects: 0,
      activeDetections: 0,
      recentInvestigations: 0,
      bySeverity: {},
    }
  }
}
