import { getPool } from '@/lib/db'
import { HardCapType, DEFAULT_HARD_CAPS } from '../types'
import { getProjectQuota } from './quotas'

/**
 * Quota check result
 */
export interface QuotaCheckResult {
  allowed: boolean
  capType: HardCapType
  currentUsage: number
  limit: number
  remaining: number
  projectId: string
}

/**
 * Check if a project has exceeded a specific quota
 */
export async function checkQuota(
  projectId: string,
  capType: HardCapType,
  currentUsage: number
): Promise<QuotaCheckResult> {
  try {
    // Get the quota limit for this project
    const quota = await getProjectQuota(projectId, capType)

    // If no custom quota is set, use the default
    const limit = quota?.cap_value ?? DEFAULT_HARD_CAPS[capType]

    const remaining = Math.max(0, limit - currentUsage)
    const allowed = currentUsage < limit

    return {
      allowed,
      capType,
      currentUsage,
      limit,
      remaining,
      projectId,
    }
  } catch (error) {
    console.error('[Quota Enforcement] Error checking quota:', error)
    // On error, allow the operation but log it
    return {
      allowed: true,
      capType,
      currentUsage,
      limit: DEFAULT_HARD_CAPS[capType],
      remaining: 0,
      projectId,
    }
  }
}

/**
 * Check multiple quotas at once
 */
export async function checkMultipleQuotas(
  projectId: string,
  usageChecks: Array<{ capType: HardCapType; currentUsage: number }>
): Promise<QuotaCheckResult[]> {
  const results: QuotaCheckResult[] = []

  for (const check of usageChecks) {
    const result = await checkQuota(projectId, check.capType, check.currentUsage)
    results.push(result)
  }

  return results
}

/**
 * Get current usage for a project (this would be implemented based on actual usage tracking)
 * For now, this is a placeholder that would need to be connected to actual metrics
 */
export async function getCurrentUsage(
  projectId: string,
  capType: HardCapType
): Promise<number> {
  const pool = getPool()

  try {
    // This is a placeholder implementation
    // In a real system, this would query actual usage metrics from logs, monitoring, etc.
    // For now, return 0 to allow operations
    return 0
  } catch (error) {
    console.error('[Quota Enforcement] Error getting current usage:', error)
    return 0
  }
}

/**
 * Check if a project can perform an operation based on quotas
 * This is the main entry point for quota enforcement
 */
export async function canPerformOperation(
  projectId: string,
  operationType: HardCapType
): Promise<boolean> {
  const currentUsage = await getCurrentUsage(projectId, operationType)
  const check = await checkQuota(projectId, operationType, currentUsage)

  return check.allowed
}

/**
 * Record usage for a quota type (placeholder for actual usage tracking)
 */
export async function recordUsage(
  projectId: string,
  capType: HardCapType,
  amount: number = 1
): Promise<void> {
  // This is a placeholder for recording usage
  // In a real system, this would increment counters in Redis, a metrics system, etc.
  // For now, we just log it
  console.log(`[Quota Enforcement] Recorded ${amount} usage for ${capType} on project ${projectId}`)
}

/**
 * Get all quota violations for a project
 */
export async function getQuotaViolations(
  projectId: string
): Promise<QuotaCheckResult[]> {
  const violations: QuotaCheckResult[] = []

  // Check all quota types
  const quotaTypes = Object.values(HardCapType)

  for (const capType of quotaTypes) {
    const currentUsage = await getCurrentUsage(projectId, capType)
    const check = await checkQuota(projectId, capType, currentUsage)

    if (!check.allowed) {
      violations.push(check)
    }
  }

  return violations
}
