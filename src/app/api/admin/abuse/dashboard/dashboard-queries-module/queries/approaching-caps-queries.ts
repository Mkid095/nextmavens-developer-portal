/**
 * Abuse Dashboard Queries Module - Approaching Caps Queries
 */

import { getPool } from '@/lib/db'
import type { ApproachingCapsStats, ApproachingCapProject } from '../../types'
import { SQL_QUERIES, ERROR_MESSAGES, EMPTY_RESULTS, DEFAULT_LIMITS } from '../constants'
import { withErrorHandling, safeParseInt, safeParseFloat } from '../utils'

/**
 * Get projects approaching caps (usage > 80%)
 *
 * Note: This is a simplified version - in production you'd track actual usage.
 * For now, we return projects that are near their limits based on quota configuration.
 */
export async function getApproachingCapsStats(): Promise<ApproachingCapsStats> {
  return withErrorHandling(
    async () => {
      const pool = getPool()
      const result = await pool.query(SQL_QUERIES.APPROACHING_CAPS(DEFAULT_LIMITS.APPROACHING_CAPS))

      const projects: ApproachingCapProject[] = result.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        cap_type: row.cap_type,
        cap_value: safeParseInt(row.cap_value),
        current_usage: safeParseInt(row.current_usage),
        usage_percentage: safeParseFloat(row.usage_percentage),
      }))

      return {
        total: projects.length,
        projects,
      }
    },
    ERROR_MESSAGES.APPROACHING_CAPS,
    EMPTY_RESULTS.APPROACHING_CAPS
  )
}
