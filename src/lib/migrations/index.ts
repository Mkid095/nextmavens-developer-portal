/**
 * Database migrations module
 *
 * This module provides functionality for managing database migrations including:
 * - Running pending migrations
 * - Rolling back migrations
 * - Getting migration status
 * - Dry-run mode to preview migrations
 * - Migration locking to prevent concurrent execution
 * - Breaking change detection and warnings
 *
 * @module migrations
 */

// Export all types
export type {
  Migration,
  MigrationRecord,
  MigrationLock,
  MigrationOptions,
  MigrationPlan,
  MigrationStatus
} from './types'

// Export main migration functions
export { runMigrations } from './runner'
export { rollbackMigration } from './rollback'
export { getMigrationStatus } from './status'
export { getMigrationPlan } from './plan'

// Export utilities for advanced use cases
export {
  isProductionEnvironment,
  logBreakingChangeWarning,
  estimateMigrationImpact,
  extractMigrationMetadata,
  parseMigrationVersion
} from './utils'

// Export lock functionality for custom lock management
export { acquireMigrationLock } from './lock'
