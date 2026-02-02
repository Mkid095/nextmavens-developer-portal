/**
 * Security Audit Logger
 * @deprecated Re-exports from audit-logger module for backward compatibility
 * Import from './audit-logger' instead
 *
 * Provides comprehensive logging for security-sensitive operations.
 * Logs all suspension actions, authorization failures, and errors.
 */

export * from './audit-logger/types'
export { logAuditEntry } from './audit-logger/logger'
export { extractClientIP, extractUserAgent } from './audit-logger/request-utils'
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
} from './audit-logger/specialized'
