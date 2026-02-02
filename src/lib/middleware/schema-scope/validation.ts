/**
 * Schema Scope Middleware - Validation
 *
 * Query validation for schema isolation.
 */

import { SchemaScopeError } from './types'

/**
 * Validate that a query doesn't attempt cross-schema access
 * Checks for schema-qualified table names that don't match the expected schema
 *
 * @param query - The SQL query to validate
 * @param expectedSchema - The expected schema name
 * @throws Error if cross-schema access detected
 */
export function validateQueryIsolation(query: string, expectedSchema: string): void {
  // Pattern to match schema-qualified table names: schema_name.table_name
  // Matches: public.users, other_schema.table, "schema"."table"
  const schemaPattern = /["']?[\w]+["']?\.["']?[\w]+["']?/g

  const matches = query.match(schemaPattern)
  if (!matches) {
    return // No schema-qualified names, safe to proceed
  }

  for (const match of matches) {
    // Extract schema name from the match
    const parts = match.split('.')
    if (parts.length >= 2) {
      let schemaName = parts[0].replace(/["']/g, '')

      // Check if it's a cross-schema reference
      // Allow: public (for system tables), information_schema (for metadata), pg_catalog (PostgreSQL system)
      const allowedSchemas = ['public', 'information_schema', 'pg_catalog', 'pg_temp', expectedSchema]

      if (!allowedSchemas.includes(schemaName)) {
        throw new Error(SchemaScopeError.CROSS_SCHEMA_ACCESS)
      }
    }
  }
}
