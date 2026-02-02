/**
 * Spike Detection Types
 * Types for usage spike detection and management
 */

import { HardCapType } from './quota.types'

/**
 * Spike severity levels
 * Classifies the severity of a detected usage spike
 */
export enum SpikeSeverity {
  /** Warning level - moderate spike (3x-5x average) */
  WARNING = 'warning',
  /** Critical level - severe spike (5x-10x average) */
  CRITICAL = 'critical',
  /** Severe level - extreme spike (10x+ average) */
  SEVERE = 'severe',
}

/**
 * Spike detection action types
 */
export enum SpikeAction {
  /** Log a warning but take no action */
  WARNING = 'warning',
  /** Suspend the project immediately */
  SUSPEND = 'suspend',
  /** No action needed */
  NONE = 'none',
}

/**
 * Spike detection configuration
 */
export interface SpikeDetectionConfig {
  /** Threshold multiplier for spike detection (e.g., 3.0 = 3x average) */
  thresholdMultiplier: number
  /** Time window to check for spikes in milliseconds */
  windowDurationMs: number
  /** Baseline period to calculate average usage in milliseconds */
  baselinePeriodMs: number
  /** Minimum usage threshold to consider for spike detection */
  minUsageThreshold: number
  /** Action to take when a spike is detected */
  action: SpikeAction
  /** Whether spike detection is enabled */
  enabled: boolean
}

/**
 * Usage spike detection result
 */
export interface UsageSpikeDetection {
  /** Project ID where spike was detected */
  project_id: string
  /** The cap type that spiked */
  cap_type: HardCapType
  /** Average usage over baseline period */
  average_usage: number
  /** Current usage in detection window */
  current_usage: number
  /** Spike multiplier (e.g., 3x average) */
  spike_multiplier: number
  /** Severity level of the spike */
  severity: SpikeSeverity
  /** When the spike was detected */
  detected_at: Date
  /** Whether action was taken (warning/suspension) */
  action_taken: 'warning' | 'suspension' | 'none'
}

/**
 * Usage statistics for a project over a time period
 */
export interface UsageStatistics {
  /** Project ID */
  project_id: string
  /** The cap type being measured */
  cap_type: HardCapType
  /** Total usage in the time period */
  total_usage: number
  /** Average usage per time unit */
  average_usage: number
  /** Peak usage in the time period */
  peak_usage: number
  /** Time period start */
  period_start: Date
  /** Time period end */
  period_end: Date
}

/**
 * Spike detection result
 */
export interface SpikeDetectionResult {
  /** Project ID that was checked */
  projectId: string
  /** The cap type that was checked */
  capType: HardCapType
  /** Whether a spike was detected */
  spikeDetected: boolean
  /** Current usage in the detection window */
  currentUsage: number
  /** Average usage over the baseline period */
  averageUsage: number
  /** Spike multiplier (currentUsage / averageUsage) */
  spikeMultiplier: number
  /** Severity level of the detected spike */
  severity: SpikeSeverity
  /** Action that was taken (if any) */
  actionTaken: SpikeAction
  /** Timestamp when the spike was detected */
  detectedAt: Date
  /** Additional details or context */
  details?: string
}

/**
 * Usage metric record for database storage
 */
export interface UsageMetric {
  /** Unique identifier */
  id: string
  /** Project ID */
  project_id: string
  /** Type of metric */
  metric_type: string
  /** Value of the metric */
  metric_value: number
  /** When the metric was recorded */
  recorded_at: Date
}

/**
 * Spike detection background job result
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
