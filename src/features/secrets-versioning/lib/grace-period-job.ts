/**
 * Grace Period Cleanup Job for Secret Versions
 * PRD: US-006 from prd-secrets-versioning.json
 *
 * @deprecated This file has been refactored into the grace-period-job-module.
 * Please import from './grace-period-job-module' instead.
 * All functionality is now organized in separate files for better maintainability.
 *
 * This job handles:
 * 1. Deleting old secret versions after their grace period expires (24 hours)
 * 2. Sending warning emails 1 hour before expiration
 * 3. Logging cleanup operations to audit log
 */

// Re-export everything from the module for backward compatibility
export * from './grace-period-job-module'
