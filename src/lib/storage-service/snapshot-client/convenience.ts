/**
 * Convenience Functions
 * Convenience functions using the default client instance
 */

import { storageServiceSnapshotClient } from './client'
import type { StorageOperationResult } from './snapshot-client/types'
import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'

export { storageServiceSnapshotClient }

export async function validateStorageOperation(
  projectId: string
): Promise<StorageOperationResult> {
  return storageServiceSnapshotClient.validateStorageOperation(projectId)
}

export async function canPerformStorageOperation(projectId: string): Promise<boolean> {
  return storageServiceSnapshotClient.canPerformStorageOperation(projectId)
}

export async function isStorageProjectActive(projectId: string): Promise<boolean> {
  return storageServiceSnapshotClient.isProjectActive(projectId)
}

export async function isStorageServiceEnabledFn(projectId: string): Promise<boolean> {
  return storageServiceSnapshotClient.isStorageServiceEnabled(projectId)
}

export { isStorageServiceEnabledFn as isStorageServiceEnabled }

export async function getStorageUploadQuota(projectId: string): Promise<number | null> {
  return storageServiceSnapshotClient.getStorageUploadQuota(projectId)
}

export async function getStorageQuotas(
  projectId: string
): Promise<ControlPlaneSnapshot['quotas'] | null> {
  return storageServiceSnapshotClient.getQuotas(projectId)
}

export async function getStorageRateLimits(
  projectId: string
): Promise<ControlPlaneSnapshot['limits'] | null> {
  return storageServiceSnapshotClient.getRateLimits(projectId)
}

export async function getStorageProjectEnvironment(projectId: string): Promise<string | null> {
  return storageServiceSnapshotClient.getProjectEnvironment(projectId)
}

export function invalidateStorageSnapshotCache(projectId: string): void {
  storageServiceSnapshotClient.invalidateCache(projectId)
}

export function clearStorageSnapshotCache(): void {
  storageServiceSnapshotClient.clearCache()
}

export function getStorageSnapshotCacheStats(): {
  size: number
  entries: Array<{ projectId: string; expiresAt: Date }>
} {
  return storageServiceSnapshotClient.getCacheStats()
}

export function cleanupExpiredStorageCacheEntries(): number {
  const cleaned = storageServiceSnapshotClient.cleanupExpiredEntries()
  if (cleaned > 0) {
    const correlationId = storageServiceSnapshotClient.getCorrelationId()
    console.log(`[Storage Service Snapshot] [${correlationId}] Cleaned up ${cleaned} expired cache entries`)
  }
  return cleaned
}

export function setStorageCorrelationId(correlationId: string): void {
  storageServiceSnapshotClient.setCorrelationId(correlationId)
}

export function getStorageCorrelationId(): string {
  return storageServiceSnapshotClient.getCorrelationId()
}

export function clearStorageContext(): void {
  storageServiceSnapshotClient.clearContext()
}
