/**
 * Abuse Control Types
 * Defines hard caps and quota management for project abuse prevention
 */

/**
 * Hard cap types that can be enforced per project
 */
export enum HardCapType {
  /** Database queries per day */
  DB_QUERIES_PER_DAY = 'db_queries_per_day',
  /** Realtime connections */
  REALTIME_CONNECTIONS = 'realtime_connections',
  /** Storage uploads per day */
  STORAGE_UPLOADS_PER_DAY = 'storage_uploads_per_day',
  /** Function invocations per day */
  FUNCTION_INVOCATIONS_PER_DAY = 'function_invocations_per_day',
}

/**
 * Default hard cap values
 */
export const DEFAULT_HARD_CAPS: Record<HardCapType, number> = {
  [HardCapType.DB_QUERIES_PER_DAY]: 10_000,
  [HardCapType.REALTIME_CONNECTIONS]: 100,
  [HardCapType.STORAGE_UPLOADS_PER_DAY]: 1_000,
  [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 5_000,
} as const

/**
 * Quota configuration for a project
 */
export interface ProjectQuota {
  id: string
  project_id: string
  cap_type: HardCapType
  cap_value: number
  created_at: Date
  updated_at: Date
}

/**
 * Hard cap configuration
 */
export interface HardCapConfig {
  type: HardCapType
  value: number
}

/**
 * Current usage statistics for a project
 */
export interface ProjectUsage {
  project_id: string
  db_queries_today: number
  realtime_connections: number
  storage_uploads_today: number
  function_invocations_today: number
}

/**
 * Quota violation result
 */
export interface QuotaViolation {
  project_id: string
  cap_type: HardCapType
  current_value: number
  cap_limit: number
  exceeded_at: Date
}

/**
 * Rate limit identifier types
 */
export enum RateLimitIdentifierType {
  /** Organization-based rate limiting */
  ORG = 'org',
  /** IP-based rate limiting */
  IP = 'ip',
}

/**
 * Rate limit identifier
 */
export interface RateLimitIdentifier {
  type: RateLimitIdentifierType
  value: string
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetAt: Date
}

/**
 * Rate limit error details
 */
export interface RateLimitError {
  identifier: RateLimitIdentifier
  limit: number
  windowMs: number
  retryAfterSeconds: number
  resetAt: Date
}

/**
 * Project status enum
 */
export enum ProjectStatus {
  /** Project is active and operational */
  ACTIVE = 'active',
  /** Project is suspended due to cap violations or abuse */
  SUSPENDED = 'suspended',
}

/**
 * Suspension reason details
 */
export interface SuspensionReason {
  /** The type of cap that was exceeded */
  cap_type: HardCapType
  /** Current usage value */
  current_value: number
  /** The limit that was exceeded */
  limit_exceeded: number
  /** Additional context about the suspension */
  details?: string
}

/**
 * Suspension record for tracking project suspensions
 */
export interface SuspensionRecord {
  /** Unique identifier for the suspension */
  id: string
  /** Project ID that was suspended */
  project_id: string
  /** Reason for suspension */
  reason: SuspensionReason
  /** The specific cap that was exceeded */
  cap_exceeded: HardCapType
  /** When the suspension was applied */
  suspended_at: Date
  /** When the suspension was resolved (null if still suspended) */
  resolved_at: Date | null
  /** Optional notes about the suspension */
  notes?: string
}

/**
 * Suspension history entry for audit trail
 */
export interface SuspensionHistoryEntry {
  /** Unique identifier for the history entry */
  id: string
  /** Project ID */
  project_id: string
  /** Action taken (suspended/unsuspended) */
  action: 'suspended' | 'unsuspended'
  /** Reason for the action */
  reason: SuspensionReason
  /** When the action occurred */
  occurred_at: Date
  /** Optional notes about the action */
  notes?: string
}
