/**
 * API Gateway Snapshot Client
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import type {
  SnapshotClientConfig,
  SnapshotFetchResult,
  RateLimitCheckResult,
  GatewayService,
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
  cleanupRateLimitTracker,
  recordRequest,
  clearRateLimitTracker,
  clearAllRateLimitTrackers,
  getRateLimitTrackingEntries,
} from './snapshot-client/rate-limit-tracker'
import {
  isProjectActive,
  isServiceEnabled,
  createInactiveProjectResult,
  createServiceDisabledResult,
  checkRateLimit as checkRateLimitFn,
} from './snapshot-client/validation'

const formatLog = (message: string) => `[ApiGateway Snapshot] ${message}`

export class ApiGatewaySnapshotClient {
  private config: SnapshotClientConfig

  constructor(config: Partial<SnapshotClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async fetchSnapshot(projectId: string): Promise<SnapshotFetchResult> {
    try {
      const url = `${this.config.controlPlaneUrl}/api/internal/snapshot?project_id=${projectId}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 503) {
          console.error(formatLog('Control plane unavailable (503)'))
          return { success: false, error: 'Control plane unavailable' }
        }
        if (response.status === 404) {
          console.error(formatLog(`Project not found: ${projectId}`))
          return { success: false, error: 'Project not found' }
        }
        console.error(formatLog(`Unexpected response: ${response.status}`))
        return { success: false, error: `Unexpected response: ${response.status}` }
      }

      const data = await response.json()

      if (!data.snapshot) {
        console.error(formatLog('No snapshot in response'))
        return { success: false, error: 'Invalid response format' }
      }

      return { success: true, snapshot: data.snapshot as ControlPlaneSnapshot }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(formatLog('Request timeout'))
        return { success: false, error: 'Request timeout' }
      }
      console.error(formatLog('Fetch error:'), error)
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
      console.log(formatLog(`Version changed for project ${projectId}: ${cached.snapshot.version} -> ${result.snapshot.version}`))
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
    return isProjectActive(snapshot, projectId)
  }

  async isServiceEnabled(projectId: string, service: GatewayService): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)
    return isServiceEnabled(snapshot, service, projectId)
  }

  async checkRateLimit(projectId: string): Promise<RateLimitCheckResult> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      console.error(formatLog(`Snapshot unavailable for project ${projectId}`))
      return { allowed: false, reason: 'Control plane unavailable' }
    }

    const result = checkRateLimitFn(snapshot, projectId)

    if (result.allowed) {
      recordRequest(projectId, Date.now())
    }

    return result
  }

  async validateRequest(
    projectId: string,
    service: GatewayService
  ): Promise<{
    allowed: boolean
    reason?: string
    retryAfter?: number
  }> {
    const snapshot = await this.getSnapshot(projectId)
    const isActive = isProjectActive(snapshot, projectId)
    if (!isActive) {
      const status = snapshot?.project.status || 'unknown'
      return createInactiveProjectResult(status)
    }

    const isEnabled = isServiceEnabled(snapshot, service, projectId)
    if (!isEnabled) {
      return createServiceDisabledResult()
    }

    const rateLimitResult = await this.checkRateLimit(projectId)
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        reason: rateLimitResult.reason || 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter,
      }
    }

    return { allowed: true }
  }

  async getRateLimits(projectId: string): Promise<ControlPlaneSnapshot['limits'] | null> {
    const snapshot = await this.getSnapshot(projectId)
    if (!snapshot) return null
    return snapshot.limits
  }

  async getQuotas(projectId: string): Promise<ControlPlaneSnapshot['quotas'] | null> {
    const snapshot = await this.getSnapshot(projectId)
    if (!snapshot) return null
    return snapshot.quotas
  }

  invalidateCache(projectId: string): void {
    invalidateSnapshotCache(projectId)
    clearRateLimitTracker(projectId)
    console.log(formatLog(`Invalidated cache for project ${projectId}`))
  }

  clearCache(): void {
    clearSnapshotCache()
    clearAllRateLimitTrackers()
    console.log(formatLog('Cleared all cache'))
  }

  getCacheStats(): {
    snapshotCacheSize: number
    rateLimitTrackerSize: number
    snapshotEntries: Array<{ projectId: string; expiresAt: Date }>
  } {
    return {
      snapshotCacheSize: getSnapshotEntries().length,
      rateLimitTrackerSize: getRateLimitTrackingEntries(),
      snapshotEntries: getSnapshotEntries(),
    }
  }

  cleanupExpiredEntries(): number {
    return cleanupExpiredCacheEntries()
  }
}
