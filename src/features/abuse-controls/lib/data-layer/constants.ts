/**
 * Constants for the abuse controls data layer
 *
 * This file contains any shared constants used across the data layer modules.
 * Currently, most constants are defined in the individual feature modules,
 * but this file is provided for future additions.
 */

/**
 * Default limits for data layer operations
 */
export const DEFAULT_LIMITS = {
  /**
   * Default limit for history queries
   */
  HISTORY_LIMIT: 50,

  /**
   * Default limit for summary queries
   */
  SUMMARY_LIMIT: 100,

  /**
   * Default time window for spike detection (in hours)
   */
  DEFAULT_SPIKE_WINDOW_HOURS: 24,

  /**
   * Default time window for error rate detection (in hours)
   */
  DEFAULT_ERROR_RATE_WINDOW_HOURS: 24,

  /**
   * Default time window for pattern detection (in hours)
   */
  DEFAULT_PATTERN_DETECTION_WINDOW_HOURS: 24,
} as const

/**
 * Error codes for data layer operations
 */
export const ERROR_CODES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PROJECT_SUSPENDED: 'PROJECT_SUSPENDED',
  INVALID_OVERRIDE_REQUEST: 'INVALID_OVERRIDE_REQUEST',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
  DETECTION_FAILED: 'DETECTION_FAILED',
} as const
