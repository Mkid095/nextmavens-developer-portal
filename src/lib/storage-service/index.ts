/**
 * Storage Service Library
 *
 * High-level API for the storage service to interact with the control plane.
 * This module provides convenient functions to validate storage operations
 * and enforce storage quotas based on control plane snapshot state.
 *
 * All functions implement fail-closed behavior:
 * - Return false/deny when control plane is unavailable
 * - Block operations when project is not active
 * - Block operations when storage service is disabled
 * - Enforce storage quotas from snapshot
 *
 * US-007: Add Correlation ID to Storage Service
 * - Supports correlation ID propagation via x-request-id header
 * - All logs include correlation ID for request tracing
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import {
  // Main class
  StorageServiceSnapshotClient,
  // Singleton instance
  storageServiceSnapshotClient,
  // Validation functions
  validateStorageOperation,
  canPerformStorageOperation,
  isStorageProjectActive,
  isStorageServiceEnabled,
  // Quota management
  getStorageUploadQuota,
  getStorageQuotas,
  // Configuration getters
  getStorageRateLimits,
  getStorageProjectEnvironment,
  // Cache management
  invalidateStorageSnapshotCache,
  clearStorageSnapshotCache,
  getStorageSnapshotCacheStats,
  cleanupExpiredStorageCacheEntries,
  // Correlation ID support (US-007)
  setStorageCorrelationId,
  getStorageCorrelationId,
  clearStorageContext,
} from './snapshot-client'

// Re-export everything for convenience
export {
  // Main class
  StorageServiceSnapshotClient,
  // Singleton instance
  storageServiceSnapshotClient,
  // Validation functions
  validateStorageOperation,
  canPerformStorageOperation,
  isStorageProjectActive,
  isStorageServiceEnabled,
  // Quota management
  getStorageUploadQuota,
  getStorageQuotas,
  // Configuration getters
  getStorageRateLimits,
  getStorageProjectEnvironment,
  // Cache management
  invalidateStorageSnapshotCache,
  clearStorageSnapshotCache,
  getStorageSnapshotCacheStats,
  cleanupExpiredStorageCacheEntries,
  // Correlation ID support (US-007)
  setStorageCorrelationId,
  getStorageCorrelationId,
  clearStorageContext,
}

/**
 * Storage operation validation result with detailed information
 */
export interface StorageOperationValidation {
  allowed: boolean
  reason?: string
  quota?: number
  remaining?: number
}

/**
 * Validate a storage operation with detailed information
 * Use this for operations that need detailed error information
 * @param projectId - Project ID
 * @returns Detailed validation result
 */
export async function validateStorageOperationWithDetails(
  projectId: string
): Promise<StorageOperationValidation> {
  const result = await validateStorageOperation(projectId)

  // Add quota details if validation passed
  if (result.allowed && result.quota !== undefined) {
    // In a real implementation, you would fetch current usage
    // For now, just return the quota
    return result
  }

  return result
}

/**
 * Get all storage-related configuration for a project
 * @param projectId - Project ID
 * @returns Configuration object or null
 */
export async function getStorageConfiguration(projectId: string): Promise<{
  projectActive: boolean
  serviceEnabled: boolean
  environment: string | null
  storageUploadQuota: number | null
  quotas: ControlPlaneSnapshot['quotas'] | null
  rateLimits: ControlPlaneSnapshot['limits'] | null
} | null> {
  const { storageServiceSnapshotClient } = await import('./snapshot-client')

  const snapshot = await storageServiceSnapshotClient.getSnapshot(projectId)

  if (!snapshot) {
    return null
  }

  return {
    projectActive: snapshot.project.status === 'ACTIVE',
    serviceEnabled: snapshot.services.storage?.enabled ?? false,
    environment: snapshot.project.environment,
    storageUploadQuota: snapshot.quotas.storage_uploads_per_day,
    quotas: snapshot.quotas,
    rateLimits: snapshot.limits,
  }
}

/**
 * Check if a storage upload is within quota
 * This is a convenience wrapper for quota checking
 * @param projectId - Project ID
 * @param currentUploads - Current number of uploads today
 * @returns true if upload is within quota
 */
export async function isWithinUploadQuota(
  projectId: string,
  currentUploads: number
): Promise<boolean> {
  const quota = await getStorageUploadQuota(projectId)

  if (quota === null) {
    // Fail closed - deny if quota unavailable
    return false
  }

  return currentUploads < quota
}

/**
 * Get storage quota status
 * @param projectId - Project ID
 * @param currentUsage - Current usage
 * @returns Quota status information
 */
export async function getStorageQuotaStatus(
  projectId: string,
  currentUsage: number
): Promise<{
  quota: number | null
  currentUsage: number
  remaining: number | null
  usagePercentage: number | null
  exceeded: boolean
}> {
  const quota = await getStorageUploadQuota(projectId)

  return {
    quota: quota,
    currentUsage: currentUsage,
    remaining: quota !== null ? Math.max(0, quota - currentUsage) : null,
    usagePercentage: quota !== null ? (currentUsage / quota) * 100 : null,
    exceeded: quota !== null ? currentUsage >= quota : false,
  }
}

/**
 * Storage operation error codes
 */
export enum StorageOperationError {
  PROJECT_NOT_ACTIVE = 'PROJECT_NOT_ACTIVE',
  PROJECT_SUSPENDED = 'PROJECT_SUSPENDED',
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  STORAGE_SERVICE_DISABLED = 'STORAGE_SERVICE_DISABLED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONTROL_PLANE_UNAVAILABLE = 'CONTROL_PLANE_UNAVAILABLE',
}

/**
 * Get a human-readable error message for a storage operation error
 * @param error - Error code
 * @returns Human-readable error message
 */
export function getStorageErrorMessage(error: StorageOperationError): string {
  switch (error) {
    case StorageOperationError.PROJECT_NOT_ACTIVE:
      return 'Project is not active'
    case StorageOperationError.PROJECT_SUSPENDED:
      return 'Project has been suspended'
    case StorageOperationError.PROJECT_ARCHIVED:
      return 'Project has been archived'
    case StorageOperationError.PROJECT_DELETED:
      return 'Project has been deleted'
    case StorageOperationError.STORAGE_SERVICE_DISABLED:
      return 'Storage service is disabled for this project'
    case StorageOperationError.QUOTA_EXCEEDED:
      return 'Storage quota exceeded'
    case StorageOperationError.CONTROL_PLANE_UNAVAILABLE:
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
export function isStorageRetryableError(error: StorageOperationError): boolean {
  return (
    error === StorageOperationError.QUOTA_EXCEEDED ||
    error === StorageOperationError.CONTROL_PLANE_UNAVAILABLE
  )
}

// Re-export types from snapshot for convenience
export type { ControlPlaneSnapshot, ProjectStatus } from '@/lib/snapshot/types'
