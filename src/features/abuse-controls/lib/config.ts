import { HardCapType, HardCapConfig, DEFAULT_HARD_CAPS } from '../types'

/**
 * Hard cap configuration constants
 */

/**
 * Default hard caps for new projects
 */
export const DEFAULT_QUOTA_CONFIGS: HardCapConfig[] = [
  {
    type: HardCapType.DB_QUERIES_PER_DAY,
    value: DEFAULT_HARD_CAPS[HardCapType.DB_QUERIES_PER_DAY],
  },
  {
    type: HardCapType.REALTIME_CONNECTIONS,
    value: DEFAULT_HARD_CAPS[HardCapType.REALTIME_CONNECTIONS],
  },
  {
    type: HardCapType.STORAGE_UPLOADS_PER_DAY,
    value: DEFAULT_HARD_CAPS[HardCapType.STORAGE_UPLOADS_PER_DAY],
  },
  {
    type: HardCapType.FUNCTION_INVOCATIONS_PER_DAY,
    value: DEFAULT_HARD_CAPS[HardCapType.FUNCTION_INVOCATIONS_PER_DAY],
  },
]

/**
 * Hard cap display names for UI
 */
export const HARD_CAP_DISPLAY_NAMES: Record<HardCapType, string> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 'Database Queries per Day',
  [HardCapType.REALTIME_CONNECTIONS]: 'Realtime Connections',
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 'Storage Uploads per Day',
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 'Function Invocations per Day',
}

/**
 * Hard cap descriptions for UI
 */
export const HARD_CAP_DESCRIPTIONS: Record<HardCapType, string> = {
  [HardCapType.DB_QUERIES_PER_DAY]:
    'Maximum number of database queries allowed per day. Exceeding this limit will trigger auto-suspension.',
  [HardCapType.REALTIME_CONNECTIONS]:
    'Maximum number of simultaneous realtime connections. Exceeding this limit will reject new connections.',
  [HardCapType.STORAGE_UPLOADS_PER_DAY]:
    'Maximum number of file uploads allowed per day. Exceeding this limit will trigger auto-suspension.',
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]:
    'Maximum number of serverless function invocations allowed per day. Exceeding this limit will trigger auto-suspension.',
}

/**
 * Minimum allowed values for each cap type
 */
export const MIN_HARD_CAPS: Record<HardCapType, number> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 100,
  [HardCapType.REALTIME_CONNECTIONS]: 1,
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 10,
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 50,
}

/**
 * Maximum allowed values for each cap type
 */
export const MAX_HARD_CAPS: Record<HardCapType, number> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 1_000_000,
  [HardCapType.REALTIME_CONNECTIONS]: 10_000,
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 100_000,
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 500_000,
}

/**
 * Validate if a cap value is within allowed range
 */
export function validateCapValue(capType: HardCapType, value: number): boolean {
  const min = MIN_HARD_CAPS[capType]
  const max = MAX_HARD_CAPS[capType]
  return value >= min && value <= max
}

/**
 * Get validation error message for a cap value
 */
export function getCapValidationError(capType: HardCapType, value: number): string | null {
  const min = MIN_HARD_CAPS[capType]
  const max = MAX_HARD_CAPS[capType]
  const displayName = HARD_CAP_DISPLAY_NAMES[capType]

  if (value < min) {
    return `${displayName} must be at least ${min.toLocaleString()}`
  }

  if (value > max) {
    return `${displayName} cannot exceed ${max.toLocaleString()}`
  }

  return null
}

/**
 * Spike Detection Configuration
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

/**
 * Error Rate Detection Configuration
 */

/**
 * Default error rate threshold percentage
 * An error rate spike is detected when error rate >= this percentage
 */
export const ERROR_RATE_THRESHOLD = 50.0

/**
 * Time window for error rate detection (in milliseconds)
 * Default: 1 hour = 3600000ms
 */
export const ERROR_RATE_DETECTION_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Minimum number of requests to consider for error rate detection
 * Projects with very few requests won't trigger error rate detection
 * This prevents false positives for new/unused projects
 */
export const MIN_REQUESTS_FOR_ERROR_RATE_DETECTION = 100

/**
 * Error rate action thresholds
 * Determines what action to take based on error rate percentage
 */
export interface ErrorRateActionThreshold {
  /** Minimum error rate percentage to trigger this action */
  minErrorRate: number
  /** Action to take */
  action: 'warning' | 'investigate' | 'none'
}

/**
 * Default error rate action thresholds
 * - 30-50%: warning
 * - 50%+: investigation
 */
export const DEFAULT_ERROR_RATE_ACTION_THRESHOLDS: ErrorRateActionThreshold[] = [
  { minErrorRate: 50.0, action: 'investigate' },
  { minErrorRate: 30.0, action: 'warning' },
]

/**
 * Error rate severity thresholds
 * Defines the percentage ranges for each severity level
 * - 30-50%: WARNING
 * - 50-75%: CRITICAL
 * - 75%+: SEVERE
 */
export interface ErrorRateSeverityThreshold {
  /** Minimum error rate percentage to trigger this severity */
  minErrorRate: number
  /** Severity level */
  severity: 'warning' | 'critical' | 'severe'
}

/**
 * Default error rate severity thresholds
 */
export const DEFAULT_ERROR_RATE_SEVERITY_THRESHOLDS: ErrorRateSeverityThreshold[] = [
  { minErrorRate: 75.0, severity: 'severe' },
  { minErrorRate: 50.0, severity: 'critical' },
  { minErrorRate: 30.0, severity: 'warning' },
]

/**
 * Determine error rate severity based on percentage
 *
 * @param errorRate - The error rate percentage
 * @returns The severity level
 */
export function determineErrorRateSeverity(errorRate: number): 'warning' | 'critical' | 'severe' {
  // Sort thresholds by minErrorRate descending to check highest first
  const sortedThresholds = [...DEFAULT_ERROR_RATE_SEVERITY_THRESHOLDS].sort(
    (a, b) => b.minErrorRate - a.minErrorRate
  )

  for (const threshold of sortedThresholds) {
    if (errorRate >= threshold.minErrorRate) {
      return threshold.severity
    }
  }

  return 'warning' // Default to warning if below all thresholds
}
