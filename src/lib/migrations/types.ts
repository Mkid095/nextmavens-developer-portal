/**
 * Migration types and interfaces
 */

export interface Migration {
  version: string
  description: string
  rollbackSql?: string
  breaking?: boolean
}

export interface MigrationRecord {
  version: string
  description: string
  applied_at: Date
  rollback_sql: string | null
  breaking: boolean
  created_at: Date
}

/**
 * Migration lock record
 */
export interface MigrationLock {
  id: number
  pid: number
  host: string
  acquired_at: Date
  migration_version: string | null
}

/**
 * Migration options for running migrations
 */
export interface MigrationOptions {
  /**
   * Automatically confirm breaking migrations
   * If false, will throw an error for breaking migrations requiring manual confirmation
   */
  autoConfirmBreaking?: boolean

  /**
   * Environment name (used for production detection)
   */
  environment?: string

  /**
   * Force run even if breaking (bypasses confirmation)
   */
  force?: boolean

  /**
   * Maximum time to wait for lock (milliseconds)
   * Default: 30000 (30 seconds)
   */
  lockTimeout?: number

  /**
   * Interval to check lock availability (milliseconds)
   * Default: 500 (0.5 seconds)
   */
  lockCheckInterval?: number

  /**
   * US-007: Dry run mode - show what migrations would be applied without actually running them
   */
  dryRun?: boolean

  /**
   * US-007: Verbose output for dry-run mode
   */
  verbose?: boolean
}

/**
 * US-007: Migration plan - describes a migration that would be applied (used for dry-run)
 */
export interface MigrationPlan {
  version: string
  description: string
  file: string
  breaking?: boolean
  rollbackSql?: string
  estimatedImpact?: string
}

/**
 * Migration status result
 */
export interface MigrationStatus {
  applied: MigrationRecord[]
  pending: string[]
}
