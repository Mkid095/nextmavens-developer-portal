/**
 * Pattern Processor Module
 * Functions for processing detected patterns and triggering actions
 */

import { getPool } from '@/lib/db'
import type { PatternDetectionResult } from '../../types'
import { PatternSeverity, MaliciousPatternType, HardCapType } from '../../types'
import { logPatternDetection } from '../../migrations/create-pattern-detections-table'
import { suspendProject } from '../suspensions'

/**
 * Trigger suspension for a detected pattern
 *
 * This function suspends a project when a CRITICAL or SEVERE pattern is detected
 * and the configuration specifies suspension on detection.
 *
 * @param detection - The pattern detection result
 * @returns Whether the suspension was triggered successfully
 */
export async function triggerSuspensionForPattern(
  detection: PatternDetectionResult
): Promise<boolean> {
  // Only trigger suspension for CRITICAL or SEVERE patterns
  if (detection.severity !== PatternSeverity.CRITICAL &&
      detection.severity !== PatternSeverity.SEVERE) {
    return false
  }

  // Only trigger if action_taken is 'suspension'
  if (detection.action_taken !== 'suspension') {
    return false
  }

  try {
    // Map pattern type to a hard cap type for suspension reason
    const capTypeMap: Record<MaliciousPatternType, HardCapType> = {
      [MaliciousPatternType.SQL_INJECTION]: HardCapType.DB_QUERIES_PER_DAY,
      [MaliciousPatternType.AUTH_BRUTE_FORCE]: HardCapType.FUNCTION_INVOCATIONS_PER_DAY,
      [MaliciousPatternType.RAPID_KEY_CREATION]: HardCapType.FUNCTION_INVOCATIONS_PER_DAY,
    }

    const capType = capTypeMap[detection.pattern_type]

    const reason = {
      cap_type: capType,
      current_value: detection.occurrence_count,
      limit_exceeded: detection.occurrence_count,
      details: detection.description,
    }

    await suspendProject(
      detection.project_id,
      reason,
      `Auto-suspended for ${detection.pattern_type}: ${detection.severity} severity pattern detected`
    )

    console.log(
      `[Pattern Detection] Suspended project ${detection.project_id} ` +
      `for ${detection.pattern_type} (${detection.severity})`
    )

    return true
  } catch (error) {
    console.error(
      `[Pattern Detection] Failed to suspend project ${detection.project_id}:`,
      error
    )
    return false
  }
}

/**
 * Process detected patterns and trigger actions
 *
 * This function logs pattern detections to the database and triggers
 * suspensions when necessary based on pattern severity and configuration.
 *
 * @param detections - Array of pattern detection results
 */
export async function processPatternDetections(
  detections: PatternDetectionResult[]
): Promise<void> {
  for (const detection of detections) {
    try {
      // Log the pattern detection to the database
      await logPatternDetection(
        detection.project_id,
        detection.pattern_type,
        detection.severity,
        detection.occurrence_count,
        detection.detection_window_ms,
        detection.description,
        detection.evidence,
        detection.action_taken
      )

      // Trigger suspension if needed
      if (detection.action_taken === 'suspension') {
        await triggerSuspensionForPattern(detection)
      }
    } catch (error) {
      console.error(
        `[Pattern Detection] Failed to process detection for project ${detection.project_id}:`,
        error
      )
    }
  }
}
