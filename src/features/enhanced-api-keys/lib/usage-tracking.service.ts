import { getPool } from '@/lib/db'

/**
 * Usage Tracking Service
 *
 * Provides functions to track API key usage statistics:
 * - Updates last_used timestamp on api_keys table
 * - Increments usage_count on api_keys table
 * - Records detailed usage stats in usage_stats table
 */

/**
 * Record a usage event for an API key
 *
 * Updates the api_keys table (last_used, usage_count) and creates
 * a detailed record in usage_stats table.
 *
 * @param keyId - The API key ID
 * @param statusCode - HTTP status code of the response
 * @param requestPath - The API endpoint path requested
 * @param requestMethod - HTTP method used (GET, POST, etc.)
 */
export async function recordKeyUsage(
  keyId: string,
  statusCode: number,
  requestPath: string,
  requestMethod: string
): Promise<{ success: boolean; error?: string }> {
  const pool = getPool()

  try {
    // Update api_keys table with last_used timestamp and increment usage_count
    await pool.query(
      `
      UPDATE api_keys
      SET
        last_used = NOW(),
        usage_count = COALESCE(usage_count, 0) + 1
      WHERE id = $1
      `,
      [keyId]
    )

    // Record detailed usage stats
    await pool.query(
      `
      INSERT INTO usage_stats (key_id, occurred_at, status_code, request_path, request_method)
      VALUES ($1, NOW(), $2, $3, $4)
      `,
      [keyId, statusCode, requestPath, requestMethod]
    )

    return { success: true }
  } catch (error: any) {
    console.error('[UsageTracking] Error recording key usage:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get usage statistics for an API key
 *
 * @param keyId - The API key ID
 * @returns Usage statistics including counts and rates
 */
export async function getKeyUsageStats(keyId: string): Promise<{
  success: boolean
  data?: {
    totalUsage: number
    lastUsed: string | null
    last7Days: number
    last30Days: number
    successRate: number
    errorRate: number
  }
  error?: string
}> {
  const pool = getPool()

  try {
    // Get basic key info
    const keyResult = await pool.query(
      `
      SELECT usage_count, last_used
      FROM api_keys
      WHERE id = $1
      `,
      [keyId]
    )

    if (keyResult.rows.length === 0) {
      return { success: false, error: 'API key not found' }
    }

    const { usage_count, last_used } = keyResult.rows[0]

    // Get request counts by time period
    const periodResult = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE occurred_at >= NOW() - INTERVAL '7 days'
        ) as last_7_days,
        COUNT(*) FILTER (
          WHERE occurred_at >= NOW() - INTERVAL '30 days'
        ) as last_30_days
      FROM usage_stats
      WHERE key_id = $1
      `,
      [keyId]
    )

    const last7Days = parseInt(periodResult.rows[0]?.last_7_days) || 0
    const last30Days = parseInt(periodResult.rows[0]?.last_30_days) || 0

    // Get success/error rate (last 30 days)
    const rateResult = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status_code BETWEEN 200 AND 299) as success,
        COUNT(*) FILTER (WHERE status_code >= 400) as error
      FROM usage_stats
      WHERE key_id = $1
        AND occurred_at >= NOW() - INTERVAL '30 days'
      `,
      [keyId]
    )

    const total = parseInt(rateResult.rows[0]?.total) || 0
    const success = parseInt(rateResult.rows[0]?.success) || 0
    const error = parseInt(rateResult.rows[0]?.error) || 0

    const successRate = total > 0 ? Math.round((success / total) * 100) : 100
    const errorRate = total > 0 ? Math.round((error / total) * 100) : 0

    return {
      success: true,
      data: {
        totalUsage: usage_count || 0,
        lastUsed,
        last7Days,
        last30Days,
        successRate,
        errorRate,
      },
    }
  } catch (error: any) {
    console.error('[UsageTracking] Error getting key usage stats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Clean up old usage stats records
 *
 * Removes usage_stats records older than the specified number of days.
 * This helps manage table size while keeping recent statistics.
 *
 * @param daysToKeep - Number of days of history to keep (default: 90)
 */
export async function cleanupOldUsageStats(daysToKeep: number = 90): Promise<{
  success: boolean
  deletedCount?: number
  error?: string
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      DELETE FROM usage_stats
      WHERE occurred_at < NOW() - INTERVAL '1 day' * $1
      `,
      [daysToKeep]
    )

    const deletedCount = result.rowCount || 0

    console.log(`[UsageTracking] Cleaned up ${deletedCount} old usage stats records`)

    return {
      success: true,
      deletedCount,
    }
  } catch (error: any) {
    console.error('[UsageTracking] Error cleaning up old usage stats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get usage stats for all keys in a project
 *
 * @param projectId - The project ID
 * @returns Array of usage stats for each key
 */
export async function getProjectKeyUsageStats(projectId: string): Promise<{
  success: boolean
  data?: Array<{
    keyId: string
    keyName: string
    totalUsage: number
    lastUsed: string | null
    last7Days: number
    last30Days: number
  }>
  error?: string
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        ak.id as key_id,
        ak.name as key_name,
        COALESCE(ak.usage_count, 0) as total_usage,
        ak.last_used,
        COUNT(us.id) FILTER (
          WHERE us.occurred_at >= NOW() - INTERVAL '7 days'
        ) as last_7_days,
        COUNT(us.id) FILTER (
          WHERE us.occurred_at >= NOW() - INTERVAL '30 days'
        ) as last_30_days
      FROM api_keys ak
      LEFT JOIN usage_stats us ON us.key_id = ak.id
      WHERE ak.project_id = $1
      GROUP BY ak.id, ak.name, ak.usage_count, ak.last_used
      ORDER BY last_used DESC NULLS LAST
      `,
      [projectId]
    )

    const data = result.rows.map(row => ({
      keyId: row.key_id,
      keyName: row.key_name,
      totalUsage: parseInt(row.total_usage) || 0,
      lastUsed: row.last_used,
      last7Days: parseInt(row.last_7_days) || 0,
      last30Days: parseInt(row.last_30_days) || 0,
    }))

    return { success: true, data }
  } catch (error: any) {
    console.error('[UsageTracking] Error getting project key usage stats:', error)
    return { success: false, error: error.message }
  }
}
