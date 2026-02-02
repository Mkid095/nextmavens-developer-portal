/**
 * Quota and Hard Cap Types
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
