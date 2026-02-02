/**
 * Convenience Functions
 */

import { apiGatewaySnapshotClient } from './client'
import type { RateLimitCheckResult, GatewayService } from './snapshot-client/types'

export { apiGatewaySnapshotClient }

export async function validateGatewayRequest(
  projectId: string,
  service: GatewayService
): Promise<{
  allowed: boolean
  reason?: string
  retryAfter?: number
}> {
  return apiGatewaySnapshotClient.validateRequest(projectId, service)
}

export async function isGatewayProjectActive(projectId: string): Promise<boolean> {
  return apiGatewaySnapshotClient.isProjectActive(projectId)
}

export async function isGatewayServiceEnabled(
  projectId: string,
  service: GatewayService
): Promise<boolean> {
  return apiGatewaySnapshotClient.isServiceEnabled(projectId, service)
}

export async function checkGatewayRateLimit(projectId: string): Promise<RateLimitCheckResult> {
  return apiGatewaySnapshotClient.checkRateLimit(projectId)
}

export function invalidateGatewaySnapshotCache(projectId: string): void {
  apiGatewaySnapshotClient.invalidateCache(projectId)
}

export function clearGatewaySnapshotCache(): void {
  apiGatewaySnapshotClient.clearCache()
}

export function getGatewaySnapshotCacheStats(): {
  snapshotCacheSize: number
  rateLimitTrackerSize: number
  snapshotEntries: Array<{ projectId: string; expiresAt: Date }>
} {
  return apiGatewaySnapshotClient.getCacheStats()
}

export function cleanupExpiredGatewayCacheEntries(): number {
  return apiGatewaySnapshotClient.cleanupExpiredEntries()
}

export function cleanupRateLimitTrackingData(): number {
  const now = Date.now()
  const windowMs = 60 * 1000
  let cleaned = 0

  const tracker = (apiGatewaySnapshotClient as any).config?.tracker || new Map()
  for (const [projectId, requests] of tracker.entries()) {
    const validRequests = requests.filter((timestamp: number) => now - timestamp < windowMs)

    if (validRequests.length === 0) {
      tracker.delete(projectId)
      cleaned++
    } else if (validRequests.length < requests.length) {
      tracker.set(projectId, validRequests)
    }
  }

  if (cleaned > 0) {
    console.log(`[ApiGateway Snapshot] Cleaned up ${cleaned} stale rate limit tracking entries`)
  }

  return cleaned
}

export type { GatewayService, RateLimitCheckResult }
