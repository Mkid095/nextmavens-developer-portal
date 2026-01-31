/**
 * Secrets Versioning Feature Module
 * PRD: US-006 from prd-secrets-versioning.json
 *
 * This module provides grace period support for secret rotation.
 * When a secret is rotated, the old version remains decryptable for 24 hours
 * (grace period) before being permanently deleted. Warnings are sent 1 hour
 * before expiration.
 */

export {
  runGracePeriodCleanupJob,
  getGracePeriodStats,
  type CleanupJobResult,
  type ExpiredSecret,
  type ExpiringSecret,
  GRACE_PERIOD_HOURS,
  WARNING_THRESHOLD_HOURS,
} from './lib/grace-period-job'
