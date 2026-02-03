/**
 * Auth Usage Tracking Module - Query Functions
 */

import { getPool } from '@/lib/db'
import type { AuthUsageStatsResult, CurrentAuthUsageResult } from './types'
import { SERVICE_NAME, LOG_PREFIXES, SQL_QUERIES, DEFAULT_TIME_RANGE_DAYS } from './constants'
import { validateProjectId } from './validators'

/**
 * Get auth usage statistics for a project
 *
 * Aggregates auth metrics for a project within a time range.
 *
 * @param projectId - The project ID
 * @param startDate - Start date for aggregation (default: 30 days ago)
 * @param endDate - End date for aggregation (default: now)
 * @returns Aggregated auth usage statistics
 */
export async function getAuthUsageStats(
  projectId: string,
  startDate: Date = new Date(Date.now() - DEFAULT_TIME_RANGE_DAYS * 24 * 60 * 60 * 1000),
  endDate: Date = new Date()
): Promise<AuthUsageStatsResult> {
  if (!validateProjectId(projectId)) {
    return {
      success: false,
      error: 'Invalid projectId',
    }
  }

  const pool = getPool()

  try {
    // Get aggregated stats
    const result = await pool.query(SQL_QUERIES.GET_AGGREGATED_STATS, [
      projectId,
      SERVICE_NAME,
      startDate,
      endDate,
    ])

    const row = result.rows[0]
    const signupCount = parseInt(row.auth_signup_count) || 0
    const signinCount = parseInt(row.auth_signin_count) || 0

    // Get breakdown by day
    const breakdownResult = await pool.query(SQL_QUERIES.GET_BREAKDOWN_BY_DAY, [
      projectId,
      SERVICE_NAME,
      startDate,
      endDate,
    ])

    const breakdownByDay = breakdownResult.rows.map((row: any) => ({
      date: row.date,
      signupCount: parseInt(row.auth_signup_count) || 0,
      signinCount: parseInt(row.auth_signin_count) || 0,
    }))

    return {
      success: true,
      data: {
        signupCount,
        signinCount,
        breakdownByDay,
      },
    }
  } catch (error: any) {
    console.error(LOG_PREFIXES.ERROR_GETTING_STATS, error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current auth usage for user growth analytics
 *
 * Returns usage counts for the current billing period (last 30 days).
 *
 * @param projectId - The project ID
 * @returns Current usage counts
 */
export async function getCurrentAuthUsage(projectId: string): Promise<CurrentAuthUsageResult> {
  const stats = await getAuthUsageStats(projectId)

  if (!stats.success || !stats.data) {
    return stats
  }

  return {
    success: true,
    data: {
      signupCount: stats.data.signupCount,
      signinCount: stats.data.signinCount,
    },
  }
}
