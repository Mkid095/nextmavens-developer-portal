/**
 * Error Rate Detection Configuration Module
 * Configuration for error rate detection
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
