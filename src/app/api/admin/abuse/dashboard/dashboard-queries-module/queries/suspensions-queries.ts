/**
 * Abuse Dashboard Queries Module - Suspensions Queries
 */

import { getPool } from '@/lib/db'
import type { SuspensionsStats } from '../../types'
import { SQL_QUERIES, ERROR_MESSAGES, EMPTY_RESULTS } from '../constants'
import { reduceSuspensionsByType, withErrorHandling } from '../utils'

/**
 * Get total suspensions in time range
 */
async function getTotalSuspensions(startTime: Date, endTime: Date): Promise<number> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.SUSPENSIONS_TOTAL({ startTime, endTime }), [
    startTime,
    endTime,
  ])
  return parseInt(result.rows[0].count)
}

/**
 * Get active suspensions count
 */
async function getActiveSuspensions(): Promise<number> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.SUSPENSIONS_ACTIVE)
  return parseInt(result.rows[0].count)
}

/**
 * Get suspensions grouped by cap type
 */
async function getSuspensionsByType(
  startTime: Date,
  endTime: Date
): Promise<Record<string, number>> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.SUSPENSIONS_BY_TYPE({ startTime, endTime }), [
    startTime,
    endTime,
  ])
  return reduceSuspensionsByType(result.rows)
}

/**
 * Get suspension statistics
 */
export async function getSuspensionsStats(
  startTime: Date,
  endTime: Date
): Promise<SuspensionsStats> {
  return withErrorHandling(
    async () => {
      const [total, active, by_type] = await Promise.all([
        getTotalSuspensions(startTime, endTime),
        getActiveSuspensions(),
        getSuspensionsByType(startTime, endTime),
      ])

      return { total, active, by_type }
    },
    ERROR_MESSAGES.SUSPENSIONS_STATS,
    EMPTY_RESULTS.SUSPENSIONS_STATS
  )
}
