/**
 * Spike Detection Configuration Module
 * Configuration for usage spike detection
 */

/**
 * Default spike threshold multiplier
 * A spike is detected when current usage >= (average_usage * SPIKE_THRESHOLD)
 */
export const SPIKE_THRESHOLD = 3.0

/**
 * Time window for spike detection (in milliseconds)
 * Default: 1 hour = 3600000ms
 */
export const SPIKE_DETECTION_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Baseline period for calculating average usage (in milliseconds)
 * Default: 24 hours = 86400000ms
 * This is the period used to calculate "normal" usage
 */
export const SPIKE_BASELINE_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Minimum usage threshold to consider for spike detection
 * Projects with very low usage won't trigger spike detection
 * This prevents false positives for new/unused projects
 */
export const MIN_USAGE_FOR_SPIKE_DETECTION = 10

/**
 * Action to take when a spike is detected
 */
export type SpikeAction = 'warning' | 'suspension' | 'none'

/**
 * Spike action thresholds
 * Determines what action to take based on spike severity
 */
export interface SpikeActionThreshold {
  /** Minimum multiplier to trigger this action */
  minMultiplier: number
  /** Action to take */
  action: SpikeAction
}

/**
 * Default spike action thresholds
 * - 3x-5x: warning
 * - 5x+: suspension
 */
export const DEFAULT_SPIKE_ACTION_THRESHOLDS: SpikeActionThreshold[] = [
  { minMultiplier: 5.0, action: 'suspension' },
  { minMultiplier: 3.0, action: 'warning' },
]

/**
 * Spike severity thresholds
 * Defines the multiplier ranges for each severity level
 * - 3x-5x: WARNING
 * - 5x-10x: CRITICAL
 * - 10x+: SEVERE
 */
export interface SpikeSeverityThreshold {
  /** Minimum multiplier to trigger this severity */
  minMultiplier: number
  /** Severity level */
  severity: 'warning' | 'critical' | 'severe'
}

/**
 * Default spike severity thresholds
 */
export const DEFAULT_SPIKE_SEVERITY_THRESHOLDS: SpikeSeverityThreshold[] = [
  { minMultiplier: 10.0, severity: 'severe' },
  { minMultiplier: 5.0, severity: 'critical' },
  { minMultiplier: 3.0, severity: 'warning' },
]

/**
 * Determine spike severity based on multiplier
 *
 * @param spikeMultiplier - The spike multiplier
 * @returns The severity level
 */
export function determineSpikeSeverity(spikeMultiplier: number): 'warning' | 'critical' | 'severe' {
  // Sort thresholds by minMultiplier descending to check highest first
  const sortedThresholds = [...DEFAULT_SPIKE_SEVERITY_THRESHOLDS].sort(
    (a, b) => b.minMultiplier - a.minMultiplier
  )

  for (const threshold of sortedThresholds) {
    if (spikeMultiplier >= threshold.minMultiplier) {
      return threshold.severity
    }
  }

  return 'warning' // Default to warning if below all thresholds
}
