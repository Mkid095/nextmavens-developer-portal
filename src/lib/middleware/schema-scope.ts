/**
 * Database Schema Scoping Middleware
 * @deprecated Re-exports from schema-scope module for backward compatibility
 * Import from './middleware/schema-scope' instead
 *
 * Middleware for scoping database queries to tenant-specific schemas.
 * Enforces project isolation by setting search_path based on project_id.
 */

export * from './middleware/schema-scope/types'
export {
  withSchemaScope,
  getScopedClient,
  withSchemaScopeHandler,
  clearTenantSlugCache,
  validateQueryIsolation,
} from './middleware/schema-scope/scope'
export { default } from './middleware/schema-scope'
