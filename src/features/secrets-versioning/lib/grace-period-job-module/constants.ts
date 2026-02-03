/**
 * Grace Period Job Module - Constants
 */

/**
 * Grace period duration in hours (24 hours)
 */
export const GRACE_PERIOD_HOURS = 24

/**
 * Warning threshold before expiration (1 hour)
 */
export const WARNING_THRESHOLD_HOURS = 1

/**
 * Log prefixes for console logging
 */
export const LOG_PREFIXES = {
  MAIN: '[GracePeriodJob]',
  START: '[GracePeriodJob] Starting grace period cleanup job',
  DELETED: '[GracePeriodJob] Deleted expired secret',
  WARNED: '[GracePeriodJob] Sent warning for expiring secret',
  COMPLETE: '[GracePeriodJob] Cleanup complete',
  STATS: '[GracePeriodJob] Would send expiration warning email',
  ERROR: '[GracePeriodJob] Error running cleanup job',
  LOG_WARNING_ERROR: '[GracePeriodJob] Failed to log warning sent',
  LOG_JOB_ERROR: '[GracePeriodJob] Failed to log job execution',
} as const

/**
 * Audit log action types
 */
export const AUDIT_ACTIONS = {
  WARNING_SENT: 'secret.expiration_warning_sent',
  CLEANUP_EXECUTED: 'secret.grace_period_cleanup_executed',
} as const

/**
 * Audit log actor information
 */
export const AUDIT_ACTOR = {
  id: 'system',
  type: 'system',
} as const
