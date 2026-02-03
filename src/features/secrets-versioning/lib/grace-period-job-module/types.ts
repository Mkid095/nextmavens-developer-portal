/**
 * Grace Period Job Module - Types
 */

/**
 * Expired secret that needs to be deleted
 */
export interface ExpiredSecret {
  id: string
  project_id: string
  name: string
  version: number
  grace_period_ends_at: Date
}

/**
 * Expiring secret that needs a warning email
 */
export interface ExpiringSecret {
  id: string
  project_id: string
  name: string
  version: number
  grace_period_ends_at: Date
  project_owner_email?: string
  project_name?: string
}

/**
 * Result of the cleanup job execution
 */
export interface CleanupJobResult {
  /** Number of expired secrets deleted */
  deletedCount: number
  /** Number of warning emails sent */
  warningCount: number
  /** List of deleted secret IDs */
  deletedSecrets: Array<{ id: string; name: string; version: number }>
  /** List of secrets that were warned about */
  warnedSecrets: Array<{ id: string; name: string; version: number; gracePeriodEndsAt: Date }>
  /** Error if any */
  error?: string
}

/**
 * Statistics about secrets in grace period
 */
export interface GracePeriodStats {
  activeSecrets: number
  inGracePeriod: number
  expired: number
  expiringSoon: number
}

/**
 * Secret query result from database
 */
export interface SecretQueryResult {
  id: string
  project_id: string
  name: string
  version: number
  grace_period_ends_at: Date
  project_name?: string
  project_owner_email?: string
}

/**
 * Count query result
 */
export interface CountResult {
  count: string
}
