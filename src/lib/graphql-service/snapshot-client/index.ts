/**
 * GraphQL Service Snapshot Client
 *
 * Client library for the GraphQL service to consume control plane snapshots.
 * This allows the GraphQL service to check project status and service enablement
 * without hitting the control database directly.
 *
 * SNAPSHOTS ARE CACHED LOCALLY with TTL to reduce control plane load.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - All operations return false (deny) when snapshot is unavailable
 * - GraphQL query execution is blocked when control plane is down
 * - This ensures security is never compromised
 *
 * US-005: Add Correlation ID to GraphQL Service
 * - Supports correlation ID propagation via x-request-id header
 * - All logs include correlation ID for request tracing
 */

// Types
export type {
  SnapshotClientConfig,
  RequestContext,
  GraphQLOperationResult,
} from './types'

// Client class
export { GraphQLServiceSnapshotClient } from './client'

// Convenience functions
export {
  graphqlServiceSnapshotClient,
  validateGraphQLOperation,
  canExecuteQuery,
  isGraphQLProjectActive,
  isGraphQLServiceEnabledFn as isGraphQLServiceEnabled,
  getGraphQLQuotas,
  getGraphQLRateLimits,
  getGraphQLProjectEnvironment,
  invalidateGraphQLSnapshotCache,
  clearGraphQLSnapshotCache,
  getGraphQLSnapshotCacheStats,
  setGraphQLCorrelationId,
  getGraphQLCorrelationId,
  clearGraphQLContext,
  cleanupExpiredGraphQLCacheEntries,
} from './convenience'

// Re-export error helpers
export {
  graphQLSchemaError,
  graphQLExecutionError,
  graphQLIntrospectionError,
  getGraphQLErrorResponse,
  isGraphQLError,
  toGraphQLErrorNextResponse,
} from './error-helpers'

// Fetcher
export { fetchSnapshot } from './fetcher'

// Validation
export {
  isProjectActive,
  isGraphQLServiceEnabled as isGraphQLServiceEnabledRaw,
  validateGraphQLOperation as validateSnapshotOperation,
} from './validation'

// Cache
export {
  getCachedSnapshot,
  setCachedSnapshot,
  isCacheValid,
  invalidateSnapshotCache,
  clearSnapshotCache,
  getSnapshotCacheStats,
  cleanupExpiredCacheEntries,
} from './cache'

// Config
export { DEFAULT_CONFIG } from './config'
