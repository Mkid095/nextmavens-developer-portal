/**
 * Storage Service Snapshot Client Validation
 * Validation methods for storage operations
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import type { StorageOperationResult } from './types'

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
 * Check if storage service is enabled for a project
 * @param snapshot - Control plane snapshot
 * @param formatLog - Function to format log messages
 * @param projectId - Project ID
 * @returns true if storage service is enabled
 */
export function isStorageServiceEnabled(
  snapshot: ControlPlaneSnapshot | null,
  formatLog: (message: string) => string,
  projectId: string
): boolean {
  if (!snapshot) {
    // Fail closed - deny if snapshot unavailable
    console.error(formatLog(`Snapshot unavailable for project ${projectId}`))
    return false
  }

  const isEnabled = snapshot.services.storage?.enabled ?? false

  if (!isEnabled) {
    console.log(formatLog(`Storage service not enabled for project ${projectId}`))
  }

  return isEnabled
}

/**
 * Create validation result for inactive project
 * @param snapshot - Control plane snapshot
 * @returns StorageOperationResult with error reason
 */
export function createInactiveProjectResult(snapshot: ControlPlaneSnapshot): StorageOperationResult {
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
 * @returns StorageOperationResult with error reason
 */
export function createServiceDisabledResult(): StorageOperationResult {
  return {
    allowed: false,
    reason: 'STORAGE_SERVICE_DISABLED',
  }
}

/**
 * Validate if a storage operation should be allowed
 * This is the main method to call before any storage operation
 *
 * Checks:
 * - Project status (must be ACTIVE)
 * - Storage service enablement (must be enabled)
 * - Quota limits
 *
 * @param snapshot - Control plane snapshot
 * @param formatLog - Function to format log messages
 * @param projectId - Project ID
 * @param quota - Storage upload quota
 * @returns Storage operation result
 */
export function validateStorageOperation(
  snapshot: ControlPlaneSnapshot | null,
  formatLog: (message: string) => string,
  projectId: string,
  quota: number | null
): StorageOperationResult {
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

  // Check storage service enablement
  const isEnabled = isStorageServiceEnabled(snapshot, formatLog, projectId)
  if (!isEnabled) {
    return createServiceDisabledResult()
  }

  return {
    allowed: true,
    quota: quota ?? undefined,
  }
}
