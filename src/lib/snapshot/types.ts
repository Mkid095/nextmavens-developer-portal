/**
 * Snapshot API Types
 *
 * Defines the schema for control plane snapshots consumed by data plane services.
 * This is the authoritative source of truth for project state.
 */

/**
 * Project status enum
 */
export type ProjectStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'DELETED'

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production'

/**
 * Service configuration
 */
export interface ServiceConfig {
  enabled: boolean
  config?: Record<string, unknown>
}

/**
 * Services that can be enabled/disabled per project
 */
export interface Services {
  auth: ServiceConfig
  graphql: ServiceConfig
  realtime: ServiceConfig
  storage: ServiceConfig
  database: ServiceConfig
  functions: ServiceConfig
}

/**
 * Rate limit configuration
 */
export interface RateLimit {
  requests_per_minute: number
  requests_per_hour: number
  requests_per_day: number
}

/**
 * Hard quota limits
 */
export interface Quotas {
  db_queries_per_day: number
  realtime_connections: number
  storage_uploads_per_day: number
  function_invocations_per_day: number
}

/**
 * Project information in snapshot
 */
export interface SnapshotProject {
  id: string
  status: ProjectStatus
  environment: Environment
  tenant_id: string
  created_at: string
  updated_at: string
}

/**
 * Snapshot response - authoritative control plane state
 */
export interface ControlPlaneSnapshot {
  version: string
  project: SnapshotProject
  services: Services
  limits: RateLimit
  quotas: Quotas
}

/**
 * Cache entry for snapshot
 */
export interface SnapshotCacheEntry {
  snapshot: ControlPlaneSnapshot
  expiresAt: Date
}

/**
 * Snapshot metadata
 */
export interface SnapshotMetadata {
  generatedAt: string
  ttl: number
  cacheHit: boolean
}
