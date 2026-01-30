import { getPool } from '@/lib/db'
import { HardCapType, DEFAULT_HARD_CAPS } from '../types'
import { getProjectQuota } from './quotas'
import { getCurrentDatabaseUsage, recordDatabaseMetric } from '@/lib/usage/database-tracking'

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
 * Get current usage for a project
 *
 * Queries the usage_metrics table to get actual usage data for quota enforcement.
 * For database-related caps, this returns the count of db_query, db_row_read, or db_row_written.
 * For other service types, this will be implemented as those tracking services are added.
 */
export async function getCurrentUsage(
  projectId: string,
  capType: HardCapType
): Promise<number> {
  const pool = getPool()

  try {
    // For database-related caps, use the database usage tracking service
    if (capType === HardCapType.DB_QUERIES_PER_DAY) {
      const result = await getCurrentDatabaseUsage(projectId)
      if (result.success && result.data) {
        return result.data.dbQueryCount
      }
      return 0
    }

    // For other service types (realtime, storage, functions),
    // query the usage_metrics table directly
    // These will be implemented as those tracking services are added (US-003, US-004, US-005)
    const serviceMap: Record<HardCapType, string> = {
      [HardCapType.REALTIME_CONNECTIONS]: 'realtime',
      [HardCapType.STORAGE_UPLOADS_PER_DAY]: 'storage',
      [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 'functions',
      [HardCapType.DB_QUERIES_PER_DAY]: 'database', // Already handled above
    }

    const metricTypeMap: Record<HardCapType, string> = {
      [HardCapType.REALTIME_CONNECTIONS]: 'realtime_connection',
      [HardCapType.STORAGE_UPLOADS_PER_DAY]: 'storage_upload',
      [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 'function_invocation',
      [HardCapType.DB_QUERIES_PER_DAY]: 'db_query', // Already handled above
    }

    const service = serviceMap[capType]
    const metricType = metricTypeMap[capType]

    if (!service || !metricType) {
      console.warn(`[Quota Enforcement] Unknown cap type mapping: ${capType}`)
      return 0
    }

    // Query usage_metrics table for today's usage
    const result = await pool.query(
      `
      SELECT COALESCE(SUM(quantity), 0) as total_usage
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = $2
        AND metric_type = $3
        AND DATE(recorded_at) = CURRENT_DATE
      `,
      [projectId, service, metricType]
    )

    return parseInt(result.rows[0]?.total_usage) || 0
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
 * Record usage for a quota type
 *
 * Records usage metrics to the usage_metrics table asynchronously.
 * This is a fire-and-forget operation that doesn't block the request.
 */
export async function recordUsage(
  projectId: string,
  capType: HardCapType,
  amount: number = 1
): Promise<void> {
  const pool = getPool()

  try {
    // For database-related caps, use the database usage tracking service
    if (capType === HardCapType.DB_QUERIES_PER_DAY) {
      // Fire and forget - don't await to avoid blocking
      recordDatabaseMetric({
        projectId,
        metricType: 'db_query',
        quantity: amount,
      }).catch(err => {
        console.error('[Quota Enforcement] Failed to record db_query metric:', err)
      })
      return
    }

    // Map cap types to service and metric type
    const serviceMap: Record<HardCapType, string> = {
      [HardCapType.REALTIME_CONNECTIONS]: 'realtime',
      [HardCapType.STORAGE_UPLOADS_PER_DAY]: 'storage',
      [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 'functions',
      [HardCapType.DB_QUERIES_PER_DAY]: 'database', // Already handled above
    }

    const metricTypeMap: Record<HardCapType, string> = {
      [HardCapType.REALTIME_CONNECTIONS]: 'realtime_connection',
      [HardCapType.STORAGE_UPLOADS_PER_DAY]: 'storage_upload',
      [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 'function_invocation',
      [HardCapType.DB_QUERIES_PER_DAY]: 'db_query', // Already handled above
    }

    const service = serviceMap[capType]
    const metricType = metricTypeMap[capType]

    if (!service || !metricType) {
      console.warn(`[Quota Enforcement] Unknown cap type mapping: ${capType}`)
      return
    }

    // Record to usage_metrics table (async, fire-and-forget)
    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [projectId, service, metricType, amount]
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Quota Enforcement] Recorded ${amount} usage for ${capType} (${metricType}) on project ${projectId}`)
    }
  } catch (error) {
    console.error('[Quota Enforcement] Failed to record usage:', {
      projectId,
      capType,
      amount,
      error: error instanceof Error ? error.message : String(error),
    })
  }
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
