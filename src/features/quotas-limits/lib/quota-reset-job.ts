/**
 * Quota Reset Background Job
 *
 * Provides the library function for managing monthly quota resets.
 * This is designed to be called by a cron job or scheduler (daily or monthly).
 *
 * Usage:
 * - Call runQuotaResetJob() from a cron job (e.g., on the 1st of each month)
 * - The function will:
 *   1. Find quotas that need to be reset (reset_at <= NOW())
 *   2. Update reset_at to next month for those quotas
 *   3. Archive usage snapshots older than the reset period
 *   4. Send notifications to project owners about quota reset
 * - Results are logged for monitoring and debugging
 *
 * US-008: Implement Quota Reset
 *
 * @module quota-reset-job
 */

// Re-export all types and functions from the modular structure
export type { QuotaToReset, QuotaResetJobResult } from './quota-reset/job'
export { runQuotaResetJob } from './quota-reset/job'

// Re-export calculation utilities
export { getNextMonthResetDate } from './quota-reset/calculation'

// Re-export reset operations
export { getQuotasNeedingReset, resetQuotaDates, archiveOldUsageSnapshots, autoResumeSuspendedProjects } from './quota-reset/reset-operations'

// Re-export notification functions
export { sendQuotaResetNotification, sendQuotaResetNotifications } from './quota-reset/notifications'
export type { NotificationResult } from './quota-reset/notifications'
