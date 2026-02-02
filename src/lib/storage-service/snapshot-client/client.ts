/**
 * Storage Service Snapshot Client
 *
 * Client library for the storage service to consume control plane snapshots.
 * US-008: Update Storage Service to Consume Snapshot
 * US-007: Add Correlation ID to Storage Service
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import { generateCorrelationId, CORRELATION_HEADER } from '@/lib/middleware/correlation'
import type {
  SnapshotClientConfig,
  SnapshotFetchResult,
  StorageOperationResult,
} from './snapshot-client/types'
import { DEFAULT_CONFIG } from './snapshot-client/config'
import {
  getCachedSnapshot,
  setCachedSnapshot,
  isCacheValid,
  deleteCachedSnapshot,
  invalidateSnapshotCache,
  clearSnapshotCache,
  getSnapshotEntries,
  cleanupExpiredCacheEntries,
} from './snapshot-client/cache'
import {
  isProjectActive,
  isStorageServiceEnabled,
  validateStorageOperation as validateSnapshotOperation,
} from './snapshot-client/validation'

/**
 * Storage Service Snapshot Client
 */
export class StorageServiceSnapshotClient {
  private config: SnapshotClientConfig
  private requestContext: { correlationId?: string }

  constructor(config: Partial<SnapshotClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.requestContext = {}
  }

  setCorrelationId(correlationId: string): void {
    this.requestContext.correlationId = correlationId
  }

  getCorrelationId(): string {
    if (!this.requestContext.correlationId) {
      this.requestContext.correlationId = generateCorrelationId()
    }
    return this.requestContext.correlationId
  }

  clearContext(): void {
    this.requestContext = {}
  }

  private formatLog(message: string): string {
    const correlationId = this.getCorrelationId()
    return `[Storage Service Snapshot] [${correlationId}] ${message}`
  }

  async fetchSnapshot(projectId: string): Promise<SnapshotFetchResult> {
    try {
      const url = `${this.config.controlPlaneUrl}/api/internal/snapshot?project_id=${projectId}`
      const correlationId = this.getCorrelationId()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          [CORRELATION_HEADER]: correlationId,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 503) {
          console.error(this.formatLog('Control plane unavailable (503)'))
          return { success: false, error: 'Control plane unavailable' }
        }
        if (response.status === 404) {
          console.error(this.formatLog(`Project not found: ${projectId}`))
          return { success: false, error: 'Project not found' }
        }
        console.error(this.formatLog(`Unexpected response: ${response.status}`))
        return { success: false, error: `Unexpected response: ${response.status}` }
      }

      const data = await response.json()

      if (!data.snapshot) {
        console.error(this.formatLog('No snapshot in response'))
        return { success: false, error: 'Invalid response format' }
      }

      return { success: true, snapshot: data.snapshot as ControlPlaneSnapshot }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(this.formatLog('Request timeout'))
        return { success: false, error: 'Request timeout' }
      }
      console.error(this.formatLog('Fetch error:'), error)
      return { success: false, error: 'Failed to fetch snapshot' }
    }
  }

  async getSnapshot(projectId: string): Promise<ControlPlaneSnapshot | null> {
    const now = Date.now()
    const cached = getCachedSnapshot(projectId)

    if (cached && isCacheValid(cached)) {
      return cached.snapshot
    }

    const result = await this.fetchSnapshot(projectId)

    if (!result.success || !result.snapshot) {
      deleteCachedSnapshot(projectId)
      return null
    }

    if (cached && cached.snapshot.version !== result.snapshot.version) {
      console.log(
        this.formatLog(`Version changed for project ${projectId}: ${cached.snapshot.version} -> ${result.snapshot.version}`)
      )
    }

    setCachedSnapshot(projectId, {
      snapshot: result.snapshot,
      expiresAt: now + this.config.cacheTTL,
      version: result.snapshot.version,
    })

    return result.snapshot
  }

  async isProjectActive(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)
    return isProjectActive(snapshot, this.formatLog.bind(this), projectId)
  }

  async isStorageServiceEnabled(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)
    return isStorageServiceEnabled(snapshot, this.formatLog.bind(this), projectId)
  }

  async getStorageUploadQuota(projectId: string): Promise<number | null> {
    const snapshot = await this.getSnapshot(projectId)
    if (!snapshot) return null
    return snapshot.quotas.storage_uploads_per_day
  }

  async validateStorageOperation(projectId: string): Promise<StorageOperationResult> {
    const snapshot = await this.getSnapshot(projectId)
    const quota = await this.getStorageUploadQuota(projectId)
    return validateSnapshotOperation(snapshot, this.formatLog.bind(this), projectId, quota)
  }

  async canPerformStorageOperation(projectId: string): Promise<boolean> {
    const result = await this.validateStorageOperation(projectId)
    return result.allowed
  }

  async getQuotas(projectId: string): Promise<ControlPlaneSnapshot['quotas'] | null> {
    const snapshot = await this.getSnapshot(projectId)
    if (!snapshot) return null
    return snapshot.quotas
  }

  async getRateLimits(projectId: string): Promise<ControlPlaneSnapshot['limits'] | null> {
    const snapshot = await this.getSnapshot(projectId)
    if (!snapshot) return null
    return snapshot.limits
  }

  async getProjectEnvironment(projectId: string): Promise<string | null> {
    const snapshot = await this.getSnapshot(projectId)
    if (!snapshot) return null
    return snapshot.project.environment
  }

  invalidateCache(projectId: string): void {
    invalidateSnapshotCache(projectId)
    console.log(this.formatLog(`Invalidated cache for project ${projectId}`))
  }

  clearCache(): void {
    clearSnapshotCache()
    console.log(this.formatLog('Cleared all cache'))
  }

  getCacheStats(): {
    size: number
    entries: Array<{ projectId: string; expiresAt: Date }>
  } {
    return {
      size: getSnapshotEntries().length,
      entries: getSnapshotEntries(),
    }
  }

  cleanupExpiredEntries(): number {
    return cleanupExpiredCacheEntries()
  }
}
