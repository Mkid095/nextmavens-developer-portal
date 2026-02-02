/**
 * Error Rate Detection Functions
 * Core detection logic for identifying high error rates
 */

import type { ErrorRateDetectionResult } from '../types'
import {
  ERROR_RATE_THRESHOLD,
  ERROR_RATE_DETECTION_WINDOW_MS,
  MIN_REQUESTS_FOR_ERROR_RATE_DETECTION,
  determineErrorRateSeverity,
} from '../config'
import { getErrorStatistics as getErrorStatsFromDb } from '../migrations/create-error-metrics-table'
import { ErrorRateSeverity, ErrorRateAction } from '../types'

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
  const pool = (await import('@/lib/db')).getPool()

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
