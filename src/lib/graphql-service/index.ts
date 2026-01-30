/**
 * GraphQL Service Library
 *
 * High-level API for the GraphQL service to interact with the control plane.
 * This module provides convenient functions to check permissions and validate
 * operations before executing GraphQL queries.
 *
 * All functions implement fail-closed behavior:
 * - Return false/deny when control plane is unavailable
 * - Block operations when project is not active
 * - Block operations when GraphQL service is disabled
 */

export {
  // Main class
  GraphQLServiceSnapshotClient,
  // Singleton instance
  graphqlServiceSnapshotClient,
  // Validation functions
  validateGraphQLOperation,
  canExecuteQuery,
  isGraphQLProjectActive,
  isGraphQLServiceEnabled,
  // Configuration getters
  getGraphQLQuotas,
  getGraphQLRateLimits,
  getGraphQLProjectEnvironment,
  // Cache management
  invalidateGraphQLSnapshotCache,
  clearGraphQLSnapshotCache,
  getGraphQLSnapshotCacheStats,
  cleanupExpiredGraphQLCacheEntries,
  // US-005: Correlation ID support for request tracing
  setGraphQLCorrelationId,
  getGraphQLCorrelationId,
  clearGraphQLContext,
  // US-007: GraphQL-specific error helpers
  graphQLSchemaError,
  graphQLExecutionError,
  graphQLIntrospectionError,
  getGraphQLErrorResponse,
  isGraphQLError,
  toGraphQLErrorNextResponse,
} from './snapshot-client'

/**
 * GraphQL operation types for logging
 */
export type GraphQLOperationType =
  | 'query'
  | 'mutation'
  | 'subscription'
  | 'introspection'

/**
 * Detailed validation result for GraphQL operations
 * US-007: Updated to include standardized error response
 */
export interface GraphQLOperationValidation {
  allowed: boolean
  errorResponse?: import('@/lib/errors').ErrorResponse
  operationType?: GraphQLOperationType
}

/**
 * Validate a GraphQL operation before execution
 * US-007: Updated to use standardized error response
 * @param projectId - Project ID
 * @param operationType - Type of GraphQL operation
 * @returns Validation result
 */
export async function validateGraphQLOperationByType(
  projectId: string,
  operationType: GraphQLOperationType = 'query'
): Promise<GraphQLOperationValidation> {
  const result = await validateGraphQLOperation(projectId)

  return {
    allowed: result.allowed,
    errorResponse: result.errorResponse,
    operationType,
  }
}

/**
 * Check if introspection is allowed for a project
 * Introspection can be disabled for security reasons
 * @param projectId - Project ID
 * @returns true if introspection is allowed
 */
export async function isIntrospectionAllowed(projectId: string): Promise<boolean> {
  // Introspection is allowed if the project is active and GraphQL service is enabled
  // Additional restrictions can be added here if needed
  return canExecuteQuery(projectId)
}

/**
 * Get all GraphQL-related configuration for a project
 * @param projectId - Project ID
 * @returns Configuration object or null
 */
export async function getGraphQLConfiguration(projectId: string): Promise<{
  projectActive: boolean
  serviceEnabled: boolean
  environment: string | null
  quotas: ControlPlaneSnapshot['quotas'] | null
  rateLimits: ControlPlaneSnapshot['limits'] | null
} | null> {
  const { graphqlServiceSnapshotClient } = await import('./snapshot-client')

  const snapshot = await graphqlServiceSnapshotClient.getSnapshot(projectId)

  if (!snapshot) {
    return null
  }

  return {
    projectActive: snapshot.project.status === 'ACTIVE',
    serviceEnabled: snapshot.services.graphql?.enabled ?? false,
    environment: snapshot.project.environment,
    quotas: snapshot.quotas,
    rateLimits: snapshot.limits,
  }
}

// Re-export types from snapshot for convenience
export type { ControlPlaneSnapshot, ProjectStatus } from '@/lib/snapshot/types'
