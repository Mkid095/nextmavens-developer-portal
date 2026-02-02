/**
 * GraphQL Service Snapshot Client Module
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

// Main client class and singleton instance
export * from './client'

// Convenience functions
export * from './convenience'

// Re-export error helpers from the original snapshot-client module
export {
  graphQLSchemaError,
  graphQLExecutionError,
  graphQLIntrospectionError,
  getGraphQLErrorResponse,
  isGraphQLError,
  toGraphQLErrorNextResponse,
} from '../snapshot-client/error-helpers'
