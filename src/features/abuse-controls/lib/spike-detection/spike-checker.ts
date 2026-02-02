/**
 * Spike Checker Module
 * Functions for checking projects for usage spikes
 */

import { getPool } from '@/lib/db'
import { HardCapType } from '../../types'
import { getSpikeDetectionConfig as getSpikeDetectionConfigFromDb } from '../../migrations/create-spike-detection-config-table'
import { getUsageStatistics as getUsageStatsFromDb } from '../../migrations/create-usage-metrics-table'
import {
  SPIKE_THRESHOLD,
  SPIKE_DETECTION_WINDOW_MS,
  MIN_USAGE_FOR_SPIKE_DETECTION,
} from '../config'
import { detectUsageSpike } from './spike-detector'

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
        allDetectedSpikes.push(...spikes)
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
