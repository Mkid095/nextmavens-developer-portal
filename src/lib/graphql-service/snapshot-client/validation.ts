/**
 * GraphQL Service Snapshot Client Validation
 * Validation methods for GraphQL operations
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import {
  PlatformError,
  projectSuspendedError,
  projectArchivedError,
  projectDeletedError,
  serviceDisabledError,
} from '@/lib/errors'
import type { GraphQLOperationResult } from './types'

/**
 * Check if a project is active
 * @param snapshot - Control plane snapshot
 * @param formatLog - Function to format log messages
 * @param projectId - Project ID
 * @returns true if project is active
 */
export function isProjectActive(
  snapshot: ControlPlaneSnapshot | null,
  formatLog: (message: string) => string,
  projectId: string
): boolean {
  if (!snapshot) {
    // Fail closed - deny if snapshot unavailable
    console.error(formatLog(`Snapshot unavailable for project ${projectId}`))
    return false
  }

  const isActive = snapshot.project.status === 'ACTIVE'

  if (!isActive) {
    console.log(formatLog(`Project ${projectId} is not active: ${snapshot.project.status}`))
  }

  return isActive
}

/**
 * Check if GraphQL service is enabled for a project
 * @param snapshot - Control plane snapshot
 * @param formatLog - Function to format log messages
 * @param projectId - Project ID
 * @returns true if GraphQL service is enabled
 */
export function isGraphQLServiceEnabled(
  snapshot: ControlPlaneSnapshot | null,
  formatLog: (message: string) => string,
  projectId: string
): boolean {
  if (!snapshot) {
    // Fail closed - deny if snapshot unavailable
    console.error(formatLog(`Snapshot unavailable for project ${projectId}`))
    return false
  }

  const isEnabled = snapshot.services.graphql?.enabled ?? false

  if (!isEnabled) {
    console.log(formatLog(`GraphQL service not enabled for project ${projectId}`))
  }

  return isEnabled
}

/**
 * Create error response for inactive project
 * @param snapshot - Control plane snapshot
 * @param projectId - Project ID
 * @returns GraphQLOperationResult with error
 */
export function createInactiveProjectError(
  snapshot: ControlPlaneSnapshot,
  projectId: string
): GraphQLOperationResult {
  const status = snapshot.project.status || 'unknown'

  let platformError: PlatformError
  switch (status) {
    case 'SUSPENDED':
      platformError = projectSuspendedError('GraphQL queries are not allowed for suspended projects', projectId)
      break
    case 'ARCHIVED':
      platformError = projectArchivedError('GraphQL queries are not allowed for archived projects', projectId)
      break
    case 'DELETED':
      platformError = projectDeletedError('GraphQL queries are not allowed for deleted projects', projectId)
      break
    default:
      platformError = serviceDisabledError('GraphQL queries are not allowed for inactive projects', 'graphql', projectId)
  }

  return {
    allowed: false,
    errorResponse: platformError.toResponse(),
  }
}

/**
 * Create error response for disabled GraphQL service
 * @param projectId - Project ID
 * @returns GraphQLOperationResult with error
 */
export function createServiceDisabledError(projectId: string): GraphQLOperationResult {
  const platformError = serviceDisabledError(
    'GraphQL service is not enabled for this project',
    'graphql',
    projectId
  )
  return {
    allowed: false,
    errorResponse: platformError.toResponse(),
  }
}

/**
 * Validate if a GraphQL operation should be allowed
 * @param snapshot - Control plane snapshot
 * @param formatLog - Function to format log messages
 * @param projectId - Project ID
 * @returns GraphQL operation result
 */
export function validateGraphQLOperation(
  snapshot: ControlPlaneSnapshot | null,
  formatLog: (message: string) => string,
  projectId: string
): GraphQLOperationResult {
  // Check project status
  const isActive = isProjectActive(snapshot, formatLog, projectId)
  if (!isActive && snapshot) {
    return createInactiveProjectError(snapshot, projectId)
  }

  if (!isActive) {
    return {
      allowed: false,
      errorResponse: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Snapshot unavailable',
          details: { projectId },
        },
      },
    }
  }

  // Check GraphQL service enablement
  const isEnabled = isGraphQLServiceEnabled(snapshot, formatLog, projectId)
  if (!isEnabled) {
    return createServiceDisabledError(projectId)
  }

  return {
    allowed: true,
  }
}
