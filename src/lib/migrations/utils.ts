/**
 * Migration utility functions
 */

import type { Migration, MigrationOptions } from './types'

/**
 * Check if current environment is production
 */
export function isProductionEnvironment(options?: MigrationOptions): boolean {
  const env = options?.environment || process.env.NODE_ENV || process.env.ENVIRONMENT || 'development'
  return env === 'production'
}

/**
 * Log a breaking change warning
 */
export function logBreakingChangeWarning(migration: Migration, version: string): void {
  console.warn('')
  console.warn('⚠️  WARNING: Breaking Change Detected!')
  console.warn(`⚠️  Migration: ${version}`)
  console.warn(`⚠️  Description: ${migration.description}`)
  console.warn(`⚠️  This migration may cause issues if not properly tested.`)
  console.warn(`⚠️  Ensure you have tested this on a staging environment first.`)
  console.warn('')
}

/**
 * US-007: Estimate the impact of a migration for dry-run output
 */
export function estimateMigrationImpact(sql: string): string {
  const upperSql = sql.toUpperCase()

  // Check for table creation
  if (upperSql.includes('CREATE TABLE')) {
    const tableMatches = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi)
    if (tableMatches) {
      return `Creates ${tableMatches.length} table${tableMatches.length > 1 ? 's' : ''}`
    }
  }

  // Check for table drops
  if (upperSql.includes('DROP TABLE')) {
    return 'DESTRUCTIVE: Drops tables'
  }

  // Check for column additions
  if (upperSql.includes('ADD COLUMN') || upperSql.includes('ALTER TABLE')) {
    return 'Modifies table schema'
  }

  // Check for index creation
  if (upperSql.includes('CREATE INDEX') || upperSql.includes('CREATE UNIQUE INDEX')) {
    return 'Creates indexes'
  }

  return 'Schema change'
}

/**
 * Extract metadata from migration file content
 */
export interface MigrationMetadata {
  description: string
  breaking: boolean
  rollbackSql?: string
}

export function extractMigrationMetadata(sql: string): MigrationMetadata {
  const lines = sql.split('\n')

  // Extract breaking flag
  const breakingLine = lines.find(line =>
    line.trim().startsWith('-- Breaking:') ||
    line.trim().startsWith('-- breaking:')
  )
  const breaking = breakingLine
    ?.replace(/^--\s*(Breaking|breaking):\s*/, '')
    ?.trim()?.toLowerCase() === 'true'

  // Extract description
  const descLine = lines.find(line =>
    line.trim().startsWith('--') &&
    !line.trim().startsWith('--===')
  ) || lines[0]
  const description = descLine
    ?.replace(/^--\s*/, '')
    ?.trim() ||
    'Unknown migration'

  // Extract rollback SQL
  const rollbackLine = lines.find(line =>
    line.trim().startsWith('-- Rollback:') ||
    line.trim().startsWith('-- rollback:')
  )
  const rollbackSql = rollbackLine
    ?.replace(/^--\s*(Rollback|rollback):\s*/, '')
    ?.trim()

  return { description, breaking, rollbackSql }
}

/**
 * Parse version from migration filename
 */
export function parseMigrationVersion(filename: string): string {
  return filename.split('_')[0]
}
