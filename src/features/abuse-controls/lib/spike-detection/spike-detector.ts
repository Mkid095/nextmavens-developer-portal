/**
 * Spike Detector Module
 * Functions for detecting usage spikes
 */

import type { SpikeDetectionResult } from '../../types'
import { HardCapType, SpikeSeverity, SpikeAction } from '../../types'
import {
  SPIKE_THRESHOLD,
  SPIKE_BASELINE_PERIOD_MS,
  MIN_USAGE_FOR_SPIKE_DETECTION,
  determineSpikeSeverity,
} from '../config'
import { calculateAverageUsage } from './usage-calculator'

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
