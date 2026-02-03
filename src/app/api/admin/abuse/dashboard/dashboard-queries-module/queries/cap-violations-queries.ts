/**
 * Abuse Dashboard Queries Module - Cap Violations Queries
 */

import { getPool } from '@/lib/db'
import type { CapViolationsStats, CapViolation } from '../../types'
import { SQL_QUERIES, ERROR_MESSAGES, EMPTY_RESULTS, DEFAULT_LIMITS } from '../constants'
import { withErrorHandling } from '../utils'

/**
 * Get projects that exceeded caps (from suspensions)
 */
export async function getCapViolationsStats(
  startTime: Date,
  endTime: Date
): Promise<CapViolationsStats> {
  return withErrorHandling(
    async () => {
      const pool = getPool()
      const result = await pool.query(
        SQL_QUERIES.CAP_VIOLATIONS({ startTime, endTime }, DEFAULT_LIMITS.CAP_VIOLATIONS),
        [startTime, endTime]
      )

      const violations: CapViolation[] = result.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        cap_exceeded: row.cap_exceeded,
        reason: row.reason,
        suspended_at: row.suspended_at,
      }))

      return {
        total: violations.length,
        violations,
      }
    },
    ERROR_MESSAGES.CAP_VIOLATIONS,
    EMPTY_RESULTS.CAP_VIOLATIONS
  )
}
