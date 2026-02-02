/**
 * Realtime Service Snapshot Client Validation
 * Validation methods for realtime connections
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import type { ConnectionValidationResult } from './types'

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
 * Check if realtime service is enabled for a project
 * @param snapshot - Control plane snapshot
 * @param formatLog - Function to format log messages
 * @param projectId - Project ID
 * @returns true if realtime service is enabled
 */
export function isRealtimeServiceEnabled(
  snapshot: ControlPlaneSnapshot | null,
  formatLog: (message: string) => string,
  projectId: string
): boolean {
  if (!snapshot) {
    // Fail closed - deny if snapshot unavailable
    console.error(formatLog(`Snapshot unavailable for project ${projectId}`))
    return false
  }

  const isEnabled = snapshot.services.realtime?.enabled ?? false

  if (!isEnabled) {
    console.log(formatLog(`Realtime service not enabled for project ${projectId}`))
  }

  return isEnabled
}

/**
 * Create validation result for inactive project
 * @param snapshot - Control plane snapshot
 * @returns ConnectionValidationResult with error reason
 */
export function createInactiveProjectResult(snapshot: ControlPlaneSnapshot): ConnectionValidationResult {
  const status = snapshot.project.status || 'unknown'

  let reason: string
  switch (status) {
    case 'SUSPENDED':
      reason = 'PROJECT_SUSPENDED'
      break
    case 'ARCHIVED':
      reason = 'PROJECT_ARCHIVED'
      break
    case 'DELETED':
      reason = 'PROJECT_DELETED'
      break
    default:
      reason = 'PROJECT_NOT_ACTIVE'
  }

  return {
    allowed: false,
    reason,
  }
}

/**
 * Create validation result for disabled service
 * @returns ConnectionValidationResult with error reason
 */
export function createServiceDisabledResult(): ConnectionValidationResult {
  return {
    allowed: false,
    reason: 'REALTIME_SERVICE_DISABLED',
  }
}

/**
 * Create validation result for connection limit exceeded
 * @returns ConnectionValidationResult with error reason and retry after
 */
export function createConnectionLimitResult(): ConnectionValidationResult {
  return {
    allowed: false,
    reason: 'CONNECTION_LIMIT_EXCEEDED',
    retryAfter: 60, // Suggest retry after 1 minute
  }
}

/**
 * Validate if a WebSocket connection should be allowed
 * This is the main method to call before accepting a WebSocket connection
 *
 * Checks:
 * - Project status (must be ACTIVE)
 * - Realtime service enablement (must be enabled)
 * - Connection limit (must not exceed quota)
 *
 * @param snapshot - Control plane snapshot
 * @param formatLog - Function to format log messages
 * @param projectId - Project ID
 * @param currentCount - Current active connection count
 * @param limit - Connection limit
 * @returns Connection validation result
 */
export function validateConnection(
  snapshot: ControlPlaneSnapshot | null,
  formatLog: (message: string) => string,
  projectId: string,
  currentCount: number,
  limit: number | null
): ConnectionValidationResult {
  // Check project status
  const isActive = isProjectActive(snapshot, formatLog, projectId)
  if (!isActive && snapshot) {
    return createInactiveProjectResult(snapshot)
  }

  if (!isActive) {
    return {
      allowed: false,
      reason: 'SNAPSHOT_UNAVAILABLE',
    }
  }

  // Check realtime service enablement
  const isEnabled = isRealtimeServiceEnabled(snapshot, formatLog, projectId)
  if (!isEnabled) {
    return createServiceDisabledResult()
  }

  // Check connection limit
  if (limit !== null && currentCount >= limit) {
    console.log(formatLog(`Connection limit exceeded for project ${projectId}: ${currentCount}/${limit}`))
    return createConnectionLimitResult()
  }

  return {
    allowed: true,
  }
}
