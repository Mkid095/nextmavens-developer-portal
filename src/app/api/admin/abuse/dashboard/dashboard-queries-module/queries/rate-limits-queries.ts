/**
 * Abuse Dashboard Queries Module - Rate Limits Queries
 */

import { getPool } from '@/lib/db'
import type { RateLimitsStats } from '../../types'
import { SQL_QUERIES, ERROR_MESSAGES, EMPTY_RESULTS } from '../constants'
import { reduceRateLimitsByType, withErrorHandling } from '../utils'

/**
 * Get total rate limit hits in time range
 */
async function getTotalRateLimits(startTime: Date, endTime: Date): Promise<number> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.RATE_LIMITS_TOTAL({ startTime, endTime }), [
    startTime,
    endTime,
  ])
  return parseInt(result.rows[0].count)
}

/**
 * Get rate limits grouped by identifier type
 */
async function getRateLimitsByType(
  startTime: Date,
  endTime: Date
): Promise<Record<string, number>> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.RATE_LIMITS_BY_TYPE({ startTime, endTime }), [
    startTime,
    endTime,
  ])
  return reduceRateLimitsByType(result.rows)
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitsStats(
  startTime: Date,
  endTime: Date
): Promise<RateLimitsStats> {
  return withErrorHandling(
    async () => {
      const [total, by_type] = await Promise.all([
        getTotalRateLimits(startTime, endTime),
        getRateLimitsByType(startTime, endTime),
      ])

      return { total, by_type }
    },
    ERROR_MESSAGES.RATE_LIMITS_STATS,
    EMPTY_RESULTS.RATE_LIMITS_STATS
  )
}
