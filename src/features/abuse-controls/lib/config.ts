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

/**
 * Malicious Pattern Detection Configuration
 */

/**
 * SQL injection detection configuration
 */
export const SQL_INJECTION_DETECTION_ENABLED = true
export const SQL_INJECTION_MIN_OCCURRENCES = 3
export const SQL_INJECTION_DETECTION_WINDOW_MS = 60 * 60 * 1000 // 1 hour
export const SQL_INJECTION_SUSPEND_ON_DETECTION = true

/**
 * Auth brute force detection configuration
 */
export const AUTH_BRUTE_FORCE_DETECTION_ENABLED = true
export const AUTH_BRUTE_FORCE_MIN_FAILED_ATTEMPTS = 10
export const AUTH_BRUTE_FORCE_DETECTION_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
export const AUTH_BRUTE_FORCE_SUSPEND_ON_DETECTION = true

/**
 * Rapid key creation detection configuration
 */
export const RAPID_KEY_CREATION_DETECTION_ENABLED = true
export const RAPID_KEY_CREATION_MIN_KEYS = 5
export const RAPID_KEY_CREATION_DETECTION_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
export const RAPID_KEY_CREATION_SUSPEND_ON_DETECTION = true

/**
 * Common SQL injection patterns to detect
 * These are regex patterns that match common SQL injection attempts
 */
export const SQL_INJECTION_PATTERNS: ReadonlyArray<{
  pattern: RegExp
  description: string
  severity: 'warning' | 'critical' | 'severe'
}> = [
  {
    pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    description: 'SQL keyword detected in input',
    severity: 'warning',
  },
  {
    pattern: /('|(\\')|(--)|(;)|(\|\|)|(\/\*)|(\*\/))/,
    description: 'SQL meta-characters detected',
    severity: 'critical',
  },
  {
    pattern: /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    description: 'SQL tautology detected',
    severity: 'severe',
  },
  {
    pattern: /(\b(UNION|JOIN)\s+SELECT)/i,
    description: 'SQL UNION/JOIN injection detected',
    severity: 'severe',
  },
  {
    pattern: /(\bEXEC\b|\bEXECUTE\b|\bEVAL\b|\bEXECUTE\s+IMMEDIATE\b)/i,
    description: 'SQL command execution detected',
    severity: 'severe',
  },
]

/**
 * Default pattern detection configuration
 */
export const DEFAULT_PATTERN_DETECTION_CONFIG = {
  sql_injection: {
    enabled: SQL_INJECTION_DETECTION_ENABLED,
    min_occurrences: SQL_INJECTION_MIN_OCCURRENCES,
    detection_window_ms: SQL_INJECTION_DETECTION_WINDOW_MS,
    suspend_on_detection: SQL_INJECTION_SUSPEND_ON_DETECTION,
  },
  auth_brute_force: {
    enabled: AUTH_BRUTE_FORCE_DETECTION_ENABLED,
    min_failed_attempts: AUTH_BRUTE_FORCE_MIN_FAILED_ATTEMPTS,
    detection_window_ms: AUTH_BRUTE_FORCE_DETECTION_WINDOW_MS,
    suspend_on_detection: AUTH_BRUTE_FORCE_SUSPEND_ON_DETECTION,
  },
  rapid_key_creation: {
    enabled: RAPID_KEY_CREATION_DETECTION_ENABLED,
    min_keys_created: RAPID_KEY_CREATION_MIN_KEYS,
    detection_window_ms: RAPID_KEY_CREATION_DETECTION_WINDOW_MS,
    suspend_on_detection: RAPID_KEY_CREATION_SUSPEND_ON_DETECTION,
  },
} as const

/**
 * Pattern severity thresholds
 * Determines what action to take based on pattern severity and count
 */
export interface PatternActionThreshold {
  /** Minimum severity to trigger this action */
  minSeverity: 'warning' | 'critical' | 'severe'
  /** Minimum occurrence count to trigger this action */
  minOccurrences: number
  /** Action to take */
  action: 'warning' | 'suspension' | 'none'
}

/**
 * Default pattern action thresholds
 */
export const DEFAULT_PATTERN_ACTION_THRESHOLDS: PatternActionThreshold[] = [
  { minSeverity: 'severe', minOccurrences: 1, action: 'suspension' },
  { minSeverity: 'critical', minOccurrences: 3, action: 'suspension' },
  { minSeverity: 'critical', minOccurrences: 1, action: 'warning' },
  { minSeverity: 'warning', minOccurrences: 5, action: 'warning' },
]

/**
 * Determine pattern action based on severity and occurrences
 *
 * @param severity - The pattern severity
 * @param occurrences - Number of occurrences
 * @returns The action to take
 */
export function determinePatternAction(
  severity: 'warning' | 'critical' | 'severe',
  occurrences: number
): 'warning' | 'suspension' | 'none' {
  // Sort thresholds by severity (severe first) and minOccurrences descending
  const severityOrder = { severe: 3, critical: 2, warning: 1 }
  const sortedThresholds = [...DEFAULT_PATTERN_ACTION_THRESHOLDS].sort(
    (a, b) => severityOrder[b.minSeverity] - severityOrder[a.minSeverity] ||
              b.minOccurrences - a.minOccurrences
  )

  for (const threshold of sortedThresholds) {
    if (severityOrder[severity] >= severityOrder[threshold.minSeverity] &&
        occurrences >= threshold.minOccurrences) {
      return threshold.action
    }
  }

  return 'none'
}
