/**
 * Audit Logger Module
 *
 * Provides comprehensive logging for security-sensitive operations.
 * Logs all suspension actions, authorization failures, and errors.
 */

export * from './types'
export { logAuditEntry } from './logger'
export { extractClientIP, extractUserAgent } from './request-utils'
export {
  logSuspension,
  logUnsuspension,
  logAuthFailure,
  logRateLimitExceeded,
  logValidationFailure,
  logBackgroundJob,
  logManualIntervention,
  logFeatureFlagEnabled,
  logFeatureFlagDisabled,
} from './specialized'
