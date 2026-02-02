/**
 * Spike Actions Module
 * Functions for triggering actions based on spike detection
 */

import type { SpikeDetectionResult } from '../../types'
import { SpikeAction } from '../../types'
import { SPIKE_THRESHOLD } from '../config'
import { suspendProject } from '../suspensions'
import { logSpikeDetection as logSpikeDetectionToDb } from '../../migrations/create-spike-detections-table'

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
