/**
 * Realtime Service Library
 *
 * High-level API for the realtime service to interact with the control plane.
 * This module provides convenient functions to validate WebSocket connections
 * and enforce connection limits based on control plane snapshot state.
 *
 * All functions implement fail-closed behavior:
 * - Return false/deny when control plane is unavailable
 * - Block connections when project is not active
 * - Block connections when realtime service is disabled
 * - Enforce connection limits from quotas
 */

export {
  // Main class
  RealtimeServiceSnapshotClient,
  // Singleton instance
  realtimeServiceSnapshotClient,
  // Validation functions
  validateRealtimeConnection,
  canAcceptConnection,
  isRealtimeProjectActive,
  isRealtimeServiceEnabled,
  // Connection management
  getRealtimeConnectionLimit,
  getActiveConnectionCount,
  incrementConnectionCount,
  decrementConnectionCount,
  resetRealtimeConnectionCount,
  clearAllConnectionCounts,
  // Configuration getters
  getRealtimeRateLimits,
  getRealtimeQuotas,
  getRealtimeProjectEnvironment,
  // Cache management
  invalidateRealtimeSnapshotCache,
  clearRealtimeSnapshotCache,
  getRealtimeSnapshotCacheStats,
  cleanupExpiredRealtimeCacheEntries,
} from './snapshot-client'

/**
 * Connection validation result with detailed information
 */
export interface RealtimeConnectionValidation {
  allowed: boolean
  reason?: string
  retryAfter?: number
  connectionLimit?: number
  currentConnections?: number
}

/**
 * Validate a WebSocket connection with detailed information
 * Use this for connection requests that need detailed error information
 * @param projectId - Project ID
 * @returns Detailed validation result
 */
export async function validateConnectionWithDetails(
  projectId: string
): Promise<RealtimeConnectionValidation> {
  const result = await validateRealtimeConnection(projectId)

  // Add connection details if validation failed due to limit
  if (result.reason === 'CONNECTION_LIMIT_EXCEEDED') {
    const limit = await getRealtimeConnectionLimit(projectId)
    const current = getActiveConnectionCount(projectId)

    return {
      ...result,
      connectionLimit: limit ?? undefined,
      currentConnections: current,
    }
  }

  return result
}

/**
 * Get all realtime-related configuration for a project
 * @param projectId - Project ID
 * @returns Configuration object or null
 */
export async function getRealtimeConfiguration(projectId: string): Promise<{
  projectActive: boolean
  serviceEnabled: boolean
  environment: string | null
  connectionLimit: number | null
  currentConnections: number
  quotas: ControlPlaneSnapshot['quotas'] | null
  rateLimits: ControlPlaneSnapshot['limits'] | null
} | null> {
  const { realtimeServiceSnapshotClient } = await import('./snapshot-client')

  const snapshot = await realtimeServiceSnapshotClient.getSnapshot(projectId)

  if (!snapshot) {
    return null
  }

  return {
    projectActive: snapshot.project.status === 'active',
    serviceEnabled: snapshot.services.realtime?.enabled ?? false,
    environment: snapshot.project.environment,
    connectionLimit: snapshot.quotas.realtime_connections,
    currentConnections: getActiveConnectionCount(projectId),
    quotas: snapshot.quotas,
    rateLimits: snapshot.limits,
  }
}

/**
 * Check if a project can accept a new connection
 * This is a convenience wrapper that includes connection limit checking
 * @param projectId - Project ID
 * @returns true if connection can be accepted
 */
export async function canAcceptNewConnection(projectId: string): Promise<boolean> {
  return canAcceptConnection(projectId)
}

/**
 * Register a new WebSocket connection
 * Call this when a connection is established
 * @param projectId - Project ID
 * @returns true if connection was registered successfully
 */
export async function registerConnection(projectId: string): Promise<boolean> {
  // First validate the connection
  const canAccept = await canAcceptConnection(projectId)

  if (!canAccept) {
    return false
  }

  // Increment the connection count
  incrementConnectionCount(projectId)
  return true
}

/**
 * Unregister a WebSocket connection
 * Call this when a connection is closed
 * @param projectId - Project ID
 */
export function unregisterConnection(projectId: string): void {
  decrementConnectionCount(projectId)
}

/**
 * Get connection statistics for a project
 * @param projectId - Project ID
 * @returns Connection statistics
 */
export async function getConnectionStats(projectId: string): Promise<{
  currentConnections: number
  connectionLimit: number | null
  availableSlots: number | null
  usagePercentage: number | null
}> {
  const current = getActiveConnectionCount(projectId)
  const limit = await getRealtimeConnectionLimit(projectId)

  return {
    currentConnections: current,
    connectionLimit: limit,
    availableSlots: limit !== null ? Math.max(0, limit - current) : null,
    usagePercentage: limit !== null ? (current / limit) * 100 : null,
  }
}

/**
 * Realtime connection error codes
 */
export enum RealtimeConnectionError {
  PROJECT_NOT_ACTIVE = 'PROJECT_NOT_ACTIVE',
  PROJECT_SUSPENDED = 'PROJECT_SUSPENDED',
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  REALTIME_SERVICE_DISABLED = 'REALTIME_SERVICE_DISABLED',
  CONNECTION_LIMIT_EXCEEDED = 'CONNECTION_LIMIT_EXCEEDED',
  CONTROL_PLANE_UNAVAILABLE = 'CONTROL_PLANE_UNAVAILABLE',
}

/**
 * Get a human-readable error message for a connection error
 * @param error - Error code
 * @returns Human-readable error message
 */
export function getErrorMessage(error: RealtimeConnectionError): string {
  switch (error) {
    case RealtimeConnectionError.PROJECT_NOT_ACTIVE:
      return 'Project is not active'
    case RealtimeConnectionError.PROJECT_SUSPENDED:
      return 'Project has been suspended'
    case RealtimeConnectionError.PROJECT_ARCHIVED:
      return 'Project has been archived'
    case RealtimeConnectionError.PROJECT_DELETED:
      return 'Project has been deleted'
    case RealtimeConnectionError.REALTIME_SERVICE_DISABLED:
      return 'Realtime service is disabled for this project'
    case RealtimeConnectionError.CONNECTION_LIMIT_EXCEEDED:
      return 'Connection limit exceeded'
    case RealtimeConnectionError.CONTROL_PLANE_UNAVAILABLE:
      return 'Control plane is temporarily unavailable'
    default:
      return 'Unknown error'
  }
}

/**
 * Check if a specific error is retryable
 * @param error - Error code
 * @returns true if the client should retry
 */
export function isRetryableError(error: RealtimeConnectionError): boolean {
  return (
    error === RealtimeConnectionError.CONNECTION_LIMIT_EXCEEDED ||
    error === RealtimeConnectionError.CONTROL_PLANE_UNAVAILABLE
  )
}

/**
 * Get suggested retry delay for an error
 * @param error - Error code
 * @returns Suggested retry delay in seconds
 */
export function getRetryDelay(error: RealtimeConnectionError): number {
  switch (error) {
    case RealtimeConnectionError.CONNECTION_LIMIT_EXCEEDED:
      return 60 // 1 minute
    case RealtimeConnectionError.CONTROL_PLANE_UNAVAILABLE:
      return 30 // 30 seconds
    default:
      return 0 // Don't retry
  }
}

// Re-export types from snapshot for convenience
export type { ControlPlaneSnapshot, ProjectStatus } from '@/lib/snapshot/types'
