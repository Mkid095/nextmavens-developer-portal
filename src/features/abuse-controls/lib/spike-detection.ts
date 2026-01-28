/**
 * Spike Detection Library
 *
 * Detects usage spikes that may indicate abuse or anomalous behavior.
 * Calculates average usage over a baseline period and compares against current usage.
 *
 * Usage:
 * - Call runSpikeDetection() from a background job (e.g., every hour)
 * - The function will check all projects for usage spikes
 * - Actions are taken based on spike severity (warning or suspension)
 */

import { getPool } from '@/lib/db'
import { HardCapType, SpikeSeverity, SpikeAction } from '../types'
import type { UsageSpikeDetection, SpikeDetectionResult } from '../types'
import {
  SPIKE_THRESHOLD,
  SPIKE_DETECTION_WINDOW_MS,
  SPIKE_BASELINE_PERIOD_MS,
  MIN_USAGE_FOR_SPIKE_DETECTION,
  DEFAULT_SPIKE_ACTION_THRESHOLDS,
  determineSpikeSeverity,
} from './config'
import { suspendProject } from './suspensions'
import { logSpikeDetection as logSpikeDetectionToDb } from '../migrations/create-spike-detections-table'
import { getUsageStatistics as getUsageStatsFromDb } from '../migrations/create-usage-metrics-table'
import { getSpikeDetectionConfig as getSpikeDetectionConfigFromDb } from '../migrations/create-spike-detection-config-table'
import { logBackgroundJob } from './audit-logger'

/**
 * Calculate average usage for a project over a time period
 *
 * @param projectId - The project to analyze
 * @param metricType - The metric type (maps to HardCapType)
 * @param startTime - Start of time period
 * @param endTime - End of time period
 * @returns Average usage over the time period
 */
export async function calculateAverageUsage(
  projectId: string,
  metricType: string,
  startTime: Date,
  endTime: Date
): Promise<number> {
  try {
    const result = await getUsageStatsFromDb(projectId, metricType, startTime, endTime)

    if (!result.success || !result.data) {
      console.warn(`[Spike Detection] No usage data for project ${projectId}, metric ${metricType}`)
      return 0
    }

    // Return average usage from the statistics
    return result.data.average || 0
  } catch (error) {
    console.error('[Spike Detection] Error calculating average usage:', error)
    return 0
  }
}

/**
 * Detect if current usage exceeds the threshold based on average
 *
 * @param projectId - The project to check
 * @param metricType - The metric type to check
 * @param currentUsage - Current usage value
 * @param thresholdMultiplier - Threshold multiplier (e.g., 3.0 for 3x average)
 * @returns Detection result with details
 */
export async function detectUsageSpike(
  projectId: string,
  metricType: string,
  currentUsage: number,
  thresholdMultiplier: number = SPIKE_THRESHOLD
): Promise<SpikeDetectionResult> {
  const now = new Date()
  const baselineStart = new Date(now.getTime() - SPIKE_BASELINE_PERIOD_MS)

  // Calculate average usage over baseline period
  const averageUsage = await calculateAverageUsage(
    projectId,
    metricType,
    baselineStart,
    now
  )

  // Calculate spike multiplier
  const spikeMultiplier = averageUsage > 0 ? currentUsage / averageUsage : 0

  // Determine severity
  const severityValue = determineSpikeSeverity(spikeMultiplier)
  const severity =
    severityValue === 'severe'
      ? SpikeSeverity.SEVERE
      : severityValue === 'critical'
      ? SpikeSeverity.CRITICAL
      : SpikeSeverity.WARNING

  // Check if spike threshold is exceeded
  const spikeDetected = spikeMultiplier >= thresholdMultiplier && averageUsage >= MIN_USAGE_FOR_SPIKE_DETECTION

  // Determine action based on severity
  let actionTaken: SpikeAction = SpikeAction.NONE
  if (spikeDetected) {
    if (severity === SpikeSeverity.SEVERE) {
      actionTaken = SpikeAction.SUSPEND
    } else if (severity === SpikeSeverity.CRITICAL) {
      actionTaken = SpikeAction.SUSPEND
    } else {
      actionTaken = SpikeAction.WARNING
    }
  }

  return {
    projectId,
    capType: metricType as HardCapType,
    spikeDetected,
    currentUsage,
    averageUsage,
    spikeMultiplier: Number(spikeMultiplier.toFixed(2)),
    severity,
    actionTaken,
    detectedAt: now,
    details: spikeDetected
      ? `Usage spike detected: ${currentUsage} (${spikeMultiplier.toFixed(2)}x average of ${averageUsage.toFixed(2)})`
      : undefined,
  }
}

/**
 * Check all metric types for a single project
 *
 * @param projectId - The project to check
 * @returns Array of spike detection results
 */
export async function checkProjectForSpikes(
  projectId: string
): Promise<SpikeDetectionResult[]> {
  const detectedSpikes: SpikeDetectionResult[] = []

  try {
    // Get project's spike detection configuration (if any)
    const configResult = await getSpikeDetectionConfigFromDb(projectId)
    const customConfig = configResult.success && configResult.data ? configResult.data : null

    // Skip if spike detection is disabled for this project
    if (customConfig && !customConfig.enabled) {
      return detectedSpikes
    }

    // Use custom config or defaults
    const thresholdMultiplier = customConfig?.threshold_multiplier ?? SPIKE_THRESHOLD
    const windowDurationMs = customConfig?.window_duration_ms ?? SPIKE_DETECTION_WINDOW_MS
    const minUsageThreshold = customConfig?.min_usage_threshold ?? MIN_USAGE_FOR_SPIKE_DETECTION

    const now = new Date()
    const windowStart = new Date(now.getTime() - windowDurationMs)

    // Check all metric types
    const metricTypes = Object.values(HardCapType)

    for (const metricType of metricTypes) {
      try {
        // Get current usage in the detection window
        const currentUsageResult = await getUsageStatsFromDb(
          projectId,
          metricType,
          windowStart,
          now
        )

        const currentUsage = currentUsageResult.success && currentUsageResult.data
          ? currentUsageResult.data.total || 0
          : 0

        // Detect spike
        const detectionResult = await detectUsageSpike(
          projectId,
          metricType,
          currentUsage,
          thresholdMultiplier
        )

        // Only add if spike is detected and above minimum usage threshold
        if (detectionResult.spikeDetected && detectionResult.averageUsage >= minUsageThreshold) {
          detectedSpikes.push(detectionResult)

          console.log(
            `[Spike Detection] Spike detected for project ${projectId}: ${metricType} is ${detectionResult.spikeMultiplier}x average (${detectionResult.currentUsage} vs ${detectionResult.averageUsage.toFixed(2)}) - Severity: ${detectionResult.severity.toUpperCase()}`
          )
        }
      } catch (error) {
        console.error(
          `[Spike Detection] Error checking metric ${metricType} for project ${projectId}:`,
          error
        )
        // Continue with next metric type
      }
    }

    return detectedSpikes
  } catch (error) {
    console.error(`[Spike Detection] Error checking project ${projectId}:`, error)
    return []
  }
}

/**
 * Trigger action based on spike detection result
 *
 * @param detection - The spike detection result
 * @returns Whether the action was successful
 */
export async function triggerSpikeAction(detection: SpikeDetectionResult): Promise<boolean> {
  try {
    // Log the spike detection to database
    await logSpikeDetectionToDb(
      detection.projectId,
      detection.capType,
      detection.currentUsage,
      detection.averageUsage,
      detection.spikeMultiplier,
      detection.severity,
      detection.actionTaken
    )

    // Take action based on severity
    if (detection.actionTaken === SpikeAction.SUSPEND) {
      // Suspend the project
      await suspendProject(
        detection.projectId,
        {
          cap_type: detection.capType,
          current_value: detection.currentUsage,
          limit_exceeded: Math.floor(detection.averageUsage * SPIKE_THRESHOLD),
          details: detection.details || `Usage spike detected: ${detection.spikeMultiplier}x average`,
        },
        'Auto-suspended due to severe usage spike'
      )

      console.log(
        `[Spike Detection] Suspended project ${detection.projectId} due to ${detection.severity} usage spike in ${detection.capType}`
      )
    } else if (detection.actionTaken === SpikeAction.WARNING) {
      // Log warning - notification would be handled by US-007
      console.warn(
        `[Spike Detection] Warning issued for project ${detection.projectId}: ${detection.details}`
      )
    }

    return true
  } catch (error) {
    console.error('[Spike Detection] Error triggering spike action:', error)
    return false
  }
}

/**
 * Check all projects for usage spikes
 *
 * This function is designed to be called by a background job/cron.
 * It iterates through all active projects and checks for usage spikes.
 *
 * @returns Array of all detected spikes
 */
export async function checkAllProjectsForSpikes(): Promise<SpikeDetectionResult[]> {
  const pool = getPool()

  try {
    console.log('[Spike Detection] Starting spike detection check for all projects')

    // Get all active projects
    const projectsResult = await pool.query(
      `
      SELECT id, project_name
      FROM projects
      WHERE status = 'active'
      `
    )

    const projects = projectsResult.rows
    console.log(`[Spike Detection] Checking ${projects.length} active projects`)

    const allDetectedSpikes: SpikeDetectionResult[] = []

    // Check each project for spikes
    for (const project of projects) {
      const projectId = project.id

      try {
        const spikes = await checkProjectForSpikes(projectId)

        // Trigger actions for each detected spike
        for (const spike of spikes) {
          await triggerSpikeAction(spike)
          allDetectedSpikes.push(spike)
        }
      } catch (error) {
        console.error(
          `[Spike Detection] Error checking project ${projectId}:`,
          error
        )
        // Continue with next project
      }
    }

    console.log(
      `[Spike Detection] Spike detection complete. ${allDetectedSpikes.length} spike(s) detected.`
    )

    return allDetectedSpikes
  } catch (error) {
    console.error('[Spike Detection] Error checking all projects for spikes:', error)
    throw new Error('Failed to check projects for spikes')
  }
}

/**
 * Background job result interface
 */
export interface SpikeDetectionJobResult {
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
  /** Number of spikes detected */
  spikesDetected: number
  /** Details of detected spikes */
  detectedSpikes: SpikeDetectionResult[]
  /** Breakdown by action type */
  actionsTaken: {
    warnings: number
    suspensions: number
  }
  /** Error message if job failed */
  error?: string
}

/**
 * Run the spike detection background job
 *
 * This function checks all active projects for usage spikes
 * and logs the results for monitoring and debugging.
 *
 * @returns Result object with job statistics and detected spikes
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runSpikeDetection();
 * console.log(`Job completed: ${result.spikesDetected} spikes detected`);
 */
export async function runSpikeDetection(): Promise<SpikeDetectionJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Spike Detection] Background job started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  try {
    // Run the spike detection
    const detectedSpikes = await checkAllProjectsForSpikes()

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    // Count actions taken
    const warnings = detectedSpikes.filter((s) => s.actionTaken === SpikeAction.WARNING).length
    const suspensions = detectedSpikes.filter((s) => s.actionTaken === SpikeAction.SUSPEND).length

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

    const result: SpikeDetectionJobResult = {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked,
      spikesDetected: detectedSpikes.length,
      detectedSpikes,
      actionsTaken: {
        warnings,
        suspensions,
      },
    }

    // Log summary
    console.log('='.repeat(60))
    console.log(`[Spike Detection] Background job completed`)
    console.log(`[Spike Detection] Duration: ${durationMs}ms`)
    console.log(`[Spike Detection] Projects checked: ${result.projectsChecked}`)
    console.log(`[Spike Detection] Spikes detected: ${result.spikesDetected}`)
    console.log(`[Spike Detection] Actions taken:`)
    console.log(`  - Warnings: ${result.actionsTaken.warnings}`)
    console.log(`  - Suspensions: ${result.actionsTaken.suspensions}`)

    if (result.spikesDetected > 0) {
      console.log(`[Spike Detection] Detected spikes:`)
      detectedSpikes.forEach((spike, index) => {
        console.log(
          `  ${index + 1}. Project ${spike.projectId} - ${spike.capType} is ${spike.spikeMultiplier}x average (${spike.severity.toUpperCase()})`
        )
      })
    }

    console.log('='.repeat(60))

    // Log the background job execution to audit logs
    await logBackgroundJob(
      'spike_detection',
      true,
      {
        duration_ms: durationMs,
        projects_checked: result.projectsChecked,
        spikes_detected: result.spikesDetected,
        warnings: result.actionsTaken.warnings,
        suspensions: result.actionsTaken.suspensions,
        detected_spikes: detectedSpikes.map((s) => ({
          project_id: s.projectId,
          cap_type: s.capType,
          severity: s.severity,
          multiplier: s.spikeMultiplier,
        })),
      }
    ).catch((error) => {
      // Don't fail the job if logging fails
      console.error('[Spike Detection] Failed to log to audit:', error)
    })

    return result
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Spike Detection] Background job failed`)
    console.error(`[Spike Detection] Duration: ${durationMs}ms`)
    console.error(`[Spike Detection] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    // Log the failed background job execution to audit logs
    await logBackgroundJob(
      'spike_detection',
      false,
      {
        duration_ms: durationMs,
        error: errorMessage,
      }
    ).catch((logError) => {
      // Don't fail if logging fails
      console.error('[Spike Detection] Failed to log to audit:', logError)
    })

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      projectsChecked: 0,
      spikesDetected: 0,
      detectedSpikes: [],
      actionsTaken: {
        warnings: 0,
        suspensions: 0,
      },
      error: errorMessage,
    }
  }
}

/**
 * Get spike detection configuration
 *
 * @returns Current spike detection configuration
 */
export function getSpikeDetectionConfig(): {
  threshold: number
  detectionWindowMs: number
  baselinePeriodMs: number
  minUsageForDetection: number
  actionThresholds: Array<{ minMultiplier: number; action: string }>
} {
  return {
    threshold: SPIKE_THRESHOLD,
    detectionWindowMs: SPIKE_DETECTION_WINDOW_MS,
    baselinePeriodMs: SPIKE_BASELINE_PERIOD_MS,
    minUsageForDetection: MIN_USAGE_FOR_SPIKE_DETECTION,
    actionThresholds: DEFAULT_SPIKE_ACTION_THRESHOLDS.map((t) => ({
      minMultiplier: t.minMultiplier,
      action: t.action,
    })),
  }
}

/**
 * Get spike detection history for a project
 *
 * @param projectId - The project to get history for
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of detected spikes in the time period
 */
export async function getSpikeDetectionHistory(
  projectId: string,
  hours: number = 24
): Promise<SpikeDetectionResult[]> {
  const pool = getPool()

  try {
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)
    const endTime = new Date()

    const result = await pool.query(
      `
      SELECT
        project_id,
        metric_type as "capType",
        current_value as "currentUsage",
        average_value as "averageUsage",
        multiplier as "spikeMultiplier",
        severity,
        action_taken as "actionTaken",
        detected_at as "detectedAt"
      FROM spike_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      ORDER BY detected_at DESC
      `,
      [projectId, startTime, endTime]
    )

    return result.rows.map((row) => ({
      projectId: row.project_id,
      capType: row.capType,
      spikeDetected: true,
      currentUsage: row.currentUsage,
      averageUsage: row.averageUsage,
      spikeMultiplier: row.spikeMultiplier,
      severity: row.severity,
      actionTaken: row.actionTaken,
      detectedAt: row.detectedAt,
    }))
  } catch (error) {
    console.error('[Spike Detection] Error getting detection history:', error)
    return []
  }
}

/**
 * Check a specific project for usage spikes
 *
 * @param projectId - The project to check
 * @returns Array of detected spikes (empty if none)
 */
export async function checkProjectSpikeStatus(
  projectId: string
): Promise<SpikeDetectionResult[]> {
  return checkProjectForSpikes(projectId)
}

/**
 * Record a usage metric for spike detection
 *
 * This function should be called periodically to record usage metrics.
 * For now, this is a placeholder that will be integrated with actual
 * usage tracking when implemented.
 *
 * @param projectId - The project to record metrics for
 * @param metricType - The type of metric
 * @param metricValue - The value of the metric
 */
export async function recordUsageMetric(
  projectId: string,
  metricType: string,
  metricValue: number
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO usage_metrics (project_id, metric_type, metric_value)
      VALUES ($1, $2, $3)
      `,
      [projectId, metricType, metricValue]
    )

    console.log(
      `[Spike Detection] Recorded metric for project ${projectId}: ${metricType} = ${metricValue}`
    )
  } catch (error) {
    console.error('[Spike Detection] Error recording usage metric:', error)
    throw new Error('Failed to record usage metric')
  }
}

/**
 * Batch record usage metrics for a project
 *
 * @param projectId - The project to record metrics for
 * @param metrics - Object mapping metric types to values
 */
export async function recordUsageMetrics(
  projectId: string,
  metrics: Partial<Record<HardCapType, number>>
): Promise<void> {
  for (const [metricType, value] of Object.entries(metrics)) {
    if (value !== undefined) {
      await recordUsageMetric(projectId, metricType, value)
    }
  }
}

/**
 * Get current spike detection status for all projects
 *
 * @returns Summary of spike detection status across all projects
 */
export async function getSpikeDetectionSummary(): Promise<{
  totalProjects: number
  activeDetections: number
  recentSuspensions: number
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

    // Get active detections in the last 24 hours
    const dayAgo = new Date()
    dayAgo.setHours(dayAgo.getHours() - 24)

    const detectionsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM spike_detections
      WHERE detected_at >= $1
      `,
      [dayAgo]
    )
    const activeDetections = parseInt(detectionsResult.rows[0].count)

    // Get recent suspensions (action_taken = 'suspension' in last 24 hours)
    const suspensionsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM spike_detections
      WHERE detected_at >= $1
        AND action_taken = 'suspension'
      `,
      [dayAgo]
    )
    const recentSuspensions = parseInt(suspensionsResult.rows[0].count)

    // Get breakdown by severity
    const severityResult = await pool.query(
      `
      SELECT severity, COUNT(*) as count
      FROM spike_detections
      WHERE detected_at >= $1
      GROUP BY severity
      `,
      [dayAgo]
    )

    const bySeverity: Record<string, number> = {}
    severityResult.rows.forEach((row: { severity: string; count: string }) => {
      bySeverity[row.severity] = parseInt(row.count)
    })

    return {
      totalProjects,
      activeDetections,
      recentSuspensions,
      bySeverity,
    }
  } catch (error) {
    console.error('[Spike Detection] Error getting summary:', error)
    return {
      totalProjects: 0,
      activeDetections: 0,
      recentSuspensions: 0,
      bySeverity: {},
    }
  }
}
