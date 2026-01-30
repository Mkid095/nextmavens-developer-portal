/**
 * Middleware Central Export
 *
 * Central export point for all middleware functionality.
 *
 * US-002: Implement Correlation ID Middleware
 * US-002: Scope Database Queries (prd-resource-isolation.json)
 */

export {
  generateCorrelationId,
  extractCorrelationId,
  withCorrelationId,
  setCorrelationHeader,
  correlationMiddleware,
  getCorrelationId,
  withCorrelation,
  CORRELATION_HEADER,
} from './correlation';

export {
  withSchemaScope,
  getScopedClient,
  withSchemaScopeHandler,
  validateQueryIsolation,
  clearTenantSlugCache,
  SchemaScopeError,
  type ScopedPool,
  type ScopedClient,
} from './schema-scope';
