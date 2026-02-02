/**
 * API Gateway Snapshot Client Validation
 * Validation methods for gateway requests
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import { getEnvironmentConfig, mapSnapshotEnvironment } from '@/lib/environment'
import type { RateLimitCheckResult } from './types'
import { cleanupRateLimitTracker } from './rate-limit-tracker'

/**
 * Check if a project is active
 * @param snapshot - Control plane snapshot
 * @param projectId - Project ID
 * @returns true if project is active
 */
export function isProjectActive(
  snapshot: ControlPlaneSnapshot | null,
  projectId: string
): boolean {
  if (!snapshot) {
    // Fail closed - deny if snapshot unavailable
    console.error(`[ApiGateway Snapshot] Snapshot unavailable for project ${projectId}`)
    return false
  }

  // Check if status is ACTIVE or CREATED (both allow API access)
  const isActive = snapshot.project.status === 'ACTIVE' || snapshot.project.status === 'CREATED'

  if (!isActive) {
    console.log(`[ApiGateway Snapshot] Project ${projectId} is not active: ${snapshot.project.status}`)
  }

  return isActive
}

/**
 * Check if a service is enabled for a project
 * @param snapshot - Control plane snapshot
 * @param service - Service to check
 * @param projectId - Project ID
 * @returns true if service is enabled
 */
export function isServiceEnabled(
  snapshot: ControlPlaneSnapshot | null,
  service: 'auth' | 'graphql' | 'realtime' | 'storage' | 'database' | 'functions',
  projectId: string
): boolean {
  if (!snapshot) {
    // Fail closed - deny if snapshot unavailable
    console.error(`[ApiGateway Snapshot] Snapshot unavailable for project ${projectId}`)
    return false
  }

  const serviceConfig = snapshot.services[service]
  const isEnabled = serviceConfig?.enabled ?? false

  if (!isEnabled) {
    console.log(`[ApiGateway Snapshot] Service ${service} not enabled for project ${projectId}`)
  }

  return isEnabled
}

/**
 * Create validation result for inactive project
 * @param status - Project status
 * @returns Validation result with error reason
 */
export function createInactiveProjectResult(status: string): {
  allowed: boolean
  reason?: string
} {
  let reason: string | undefined

  if (status === 'SUSPENDED') {
    reason = 'PROJECT_SUSPENDED'
  } else if (status === 'ARCHIVED') {
    reason = 'PROJECT_ARCHIVED'
  } else if (status === 'DELETED') {
    reason = 'PROJECT_DELETED'
  } else if (status === 'CREATED') {
    // CREATED projects should be allowed, this shouldn't happen
    reason = 'PROJECT_NOT_ACTIVE'
  } else {
    reason = 'PROJECT_NOT_ACTIVE'
  }

  return {
    allowed: false,
    reason,
  }
}

/**
 * Create validation result for disabled service
 * @returns Validation result with error reason
 */
export function createServiceDisabledResult(): {
  allowed: boolean
  reason?: string
} {
  return {
    allowed: false,
    reason: 'SERVICE_DISABLED',
  }
}

/**
 * Check rate limit for a project
 *
 * US-004: Rate limit checking uses environment config multiplier.
 * - Dev environment gets 10x rate limit
 * - Staging gets 5x rate limit
 * - Prod gets standard rate limit (1x multiplier)
 *
 * @param snapshot - Control plane snapshot
 * @param projectId - Project ID
 * @returns Rate limit check result
 */
export function checkRateLimit(
  snapshot: ControlPlaneSnapshot,
  projectId: string
): RateLimitCheckResult {
  const limits = snapshot.limits
  const now = Date.now()

  // Get environment config for rate limit multiplier
  const environment = mapSnapshotEnvironment(snapshot.project.environment)
  const envConfig = getEnvironmentConfig(environment)
  const rateLimitMultiplier = envConfig.rate_limit_multiplier

  // Calculate effective rate limit with environment multiplier
  const effectiveLimit = Math.floor(limits.requests_per_minute * rateLimitMultiplier)

  // Clean up old requests
  cleanupRateLimitTracker(projectId, 60 * 1000) // 1 minute window

  // Get current requests
  const requests = (snapshot as any).requests || []

  // Check per-minute limit with environment multiplier applied
  if (requests.length >= effectiveLimit) {
    console.log(`[ApiGateway Snapshot] Rate limit exceeded for project ${projectId} (per-minute: ${requests.length}/${effectiveLimit}, env: ${environment})`)
    return {
      allowed: false,
      reason: 'Rate limit exceeded (per-minute)',
      retryAfter: 60,
    }
  }

  return {
    allowed: true,
  }
}
