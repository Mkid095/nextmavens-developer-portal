/**
 * Error Rate Metrics Functions
 * Functions for recording and retrieving error rate metrics
 */

import { getPool } from '@/lib/db'
import type { ErrorRateDetectionResult } from '../types'
import {
  ERROR_RATE_THRESHOLD,
  ERROR_RATE_DETECTION_WINDOW_MS,
  MIN_REQUESTS_FOR_ERROR_RATE_DETECTION,
  DEFAULT_ERROR_RATE_ACTION_THRESHOLDS,
} from '../config'
import { checkProjectForHighErrorRate } from './detection'

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
