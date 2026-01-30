/**
 * API Key Usage Tracking Module
 *
 * Tracks detailed API key usage for statistics and analytics.
 * Part of US-009: Track Key Usage
 */

import { getPool } from './db'

/**
 * API usage log entry
 */
export interface ApiUsageLog {
  key_id: string
  project_id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms?: number
  occurred_at?: Date
}

/**
 * Log an API usage event to the api_usage_logs table.
 * This function is designed to be called asynchronously (fire and forget)
 * to avoid blocking the main request/response cycle.
 *
 * US-009: Track Key Usage - usage_stats table tracks request count
 *
 * @param log - The usage log entry to record
 */
export async function logApiUsage(log: ApiUsageLog): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `INSERT INTO api_usage_logs (key_id, project_id, endpoint, method, status_code, response_time_ms, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()))`,
      [
        log.key_id,
        log.project_id,
        log.endpoint,
        log.method,
        log.status_code,
        log.response_time_ms || null,
        log.occurred_at || null,
      ]
    )
  } catch (error) {
    // Don't throw - we don't want usage logging to break API requests
    console.error('[KeyUsageTracking] Failed to log API usage:', error)
  }
}

/**
 * Get usage statistics for a specific API key.
 *
 * US-009: Request count per key (7 day, 30 day)
 *
 * @param keyId - The API key ID
 * @returns Usage statistics including time period counts and success/error rates
 */
export async function getKeyUsageStats(keyId: string) {
  const pool = getPool()

  try {
    // Get usage by time period (last 7 days and last 30 days)
    const usageResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (
          WHERE occurred_at >= NOW() - INTERVAL '7 days'
        ) as last_7_days,
        COUNT(*) FILTER (
          WHERE occurred_at >= NOW() - INTERVAL '30 days'
        ) as last_30_days
      FROM api_usage_logs
      WHERE key_id = $1`,
      [keyId]
    )

    const last7DaysCount = parseInt(usageResult.rows[0].last_7_days) || 0
    const last30DaysCount = parseInt(usageResult.rows[0].last_30_days) || 0

    // Get success/error rate from api_usage_logs
    const rateResult = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status_code BETWEEN 200 AND 299) as success,
        COUNT(*) FILTER (WHERE status_code >= 400) as error
      FROM api_usage_logs
      WHERE key_id = $1
        AND occurred_at >= NOW() - INTERVAL '30 days'`,
      [keyId]
    )

    const total = parseInt(rateResult.rows[0].total) || 0
    const success = parseInt(rateResult.rows[0].success) || 0
    const error = parseInt(rateResult.rows[0].error) || 0

    const successErrorRate = {
      total,
      success,
      error,
      successRate: total > 0 ? Math.round((success / total) * 100) : 100,
      errorRate: total > 0 ? Math.round((error / total) * 100) : 0,
    }

    return {
      usage_by_time_period: {
        last_7_days: last7DaysCount,
        last_30_days: last30DaysCount,
      },
      success_error_rate: successErrorRate,
    }
  } catch (err) {
    // api_usage_logs table might not exist yet, return defaults
    console.log('[KeyUsageTracking] api_usage_logs table not available, using defaults')
    return {
      usage_by_time_period: {
        last_7_days: 0,
        last_30_days: 0,
      },
      success_error_rate: {
        total: 0,
        success: 0,
        error: 0,
        successRate: 100,
        errorRate: 0,
      },
    }
  }
}

/**
 * Clean up old usage logs (older than 90 days) to prevent unbounded table growth.
 * This should be called periodically (e.g., daily) via a background job or cron.
 *
 * @param daysToKeep - Number of days of history to keep (default: 90)
 * @returns Number of rows deleted
 */
export async function cleanupOldUsageLogs(daysToKeep: number = 90): Promise<number> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `DELETE FROM api_usage_logs
       WHERE occurred_at < NOW() - INTERVAL '1 day' * $1`,
      [daysToKeep]
    )

    const rowCount = result.rowCount || 0
    console.log(`[KeyUsageTracking] Cleaned up ${rowCount} old usage logs (older than ${daysToKeep} days)`)
    return rowCount
  } catch (error) {
    console.error('[KeyUsageTracking] Failed to cleanup old usage logs:', error)
    return 0
  }
}
