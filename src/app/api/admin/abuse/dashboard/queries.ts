/**
 * Abuse Dashboard API - Database Queries
 */

import { getPool } from '@/lib/db'
import type {
  SuspensionsStats,
  RateLimitsStats,
  CapViolationsStats,
  ApproachingCapsStats,
  PatternsStats,
} from './types'

/**
 * Get suspension statistics
 */
export async function getSuspensionsStats(startTime: Date, endTime: Date): Promise<SuspensionsStats> {
  const pool = getPool()

  try {
    // Get total suspensions in time range
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM suspensions
      WHERE suspended_at >= $1 AND suspended_at <= $2
      `,
      [startTime, endTime]
    )

    // Get active suspensions
    const activeResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM suspensions
      WHERE resolved_at IS NULL
      `
    )

    // Get suspensions by cap type
    const byTypeResult = await pool.query(
      `
      SELECT
        cap_exceeded,
        COUNT(*) as count
      FROM suspensions
      WHERE suspended_at >= $1 AND suspended_at <= $2
      GROUP BY cap_exceeded
      `,
      [startTime, endTime]
    )

    return {
      total: parseInt(totalResult.rows[0].count),
      active: parseInt(activeResult.rows[0].count),
      by_type: byTypeResult.rows.reduce(
        (acc: Record<string, number>, row: { cap_exceeded: string; count: string }) => {
          acc[row.cap_exceeded] = parseInt(row.count)
          return acc
        },
        {}
      ),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching suspension stats:', error)
    return {
      total: 0,
      active: 0,
      by_type: {},
    }
  }
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitsStats(startTime: Date, endTime: Date): Promise<RateLimitsStats> {
  const pool = getPool()

  try {
    // Get total rate limit hits
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM rate_limits
      WHERE created_at >= $1 AND created_at <= $2
      `,
      [startTime, endTime]
    )

    // Get rate limits by identifier type
    const byTypeResult = await pool.query(
      `
      SELECT
        identifier_type,
        COUNT(*) as count
      FROM rate_limits
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY identifier_type
      `,
      [startTime, endTime]
    )

    return {
      total: parseInt(totalResult.rows[0].count),
      by_type: byTypeResult.rows.reduce(
        (acc: Record<string, number>, row: { identifier_type: string; count: string }) => {
          acc[row.identifier_type] = parseInt(row.count)
          return acc
        },
        {}
      ),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching rate limit stats:', error)
    return {
      total: 0,
      by_type: {},
    }
  }
}

/**
 * Get cap violation statistics
 */
export async function getCapViolationsStats(startTime: Date, endTime: Date): Promise<CapViolationsStats> {
  const pool = getPool()

  try {
    // Get projects that exceeded caps (from suspensions)
    const result = await pool.query(
      `
      SELECT
        s.project_id,
        p.name as project_name,
        p.organization,
        s.cap_exceeded,
        s.reason,
        s.suspended_at
      FROM suspensions s
      JOIN projects p ON s.project_id = p.id
      WHERE s.suspended_at >= $1 AND s.suspended_at <= $2
      ORDER BY s.suspended_at DESC
      LIMIT 50
      `,
      [startTime, endTime]
    )

    return {
      total: result.rows.length,
      violations: result.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        cap_exceeded: row.cap_exceeded,
        reason: row.reason,
        suspended_at: row.suspended_at,
      })),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching cap violations:', error)
    return {
      total: 0,
      violations: [],
    }
  }
}

/**
 * Get projects approaching caps (usage > 80%)
 */
export async function getApproachingCapsStats(): Promise<ApproachingCapsStats> {
  const pool = getPool()

  try {
    // This is a simplified version - in production you'd track actual usage
    // For now, we'll return projects that are near their limits based on quota configuration
    const result = await pool.query(
      `
      SELECT
        q.project_id,
        p.name as project_name,
        p.organization,
        q.cap_type,
        q.cap_value,
        -- This would be replaced with actual usage tracking
        0 as current_usage,
        0 as usage_percentage
      FROM quotas q
      JOIN projects p ON q.project_id = p.id
      WHERE p.status = 'active'
      ORDER BY q.cap_value DESC
      LIMIT 20
      `
    )

    return {
      total: result.rows.length,
      projects: result.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        cap_type: row.cap_type,
        cap_value: parseInt(row.cap_value),
        current_usage: parseInt(row.current_usage),
        usage_percentage: parseFloat(row.usage_percentage),
      })),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching approaching caps:', error)
    return {
      total: 0,
      projects: [],
    }
  }
}

/**
 * Get suspicious pattern statistics
 */
export async function getPatternsStats(startTime: Date, endTime: Date): Promise<PatternsStats> {
  const pool = getPool()

  try {
    // Get total pattern detections
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      `,
      [startTime, endTime]
    )

    // Get patterns by type
    const byTypeResult = await pool.query(
      `
      SELECT
        pattern_type,
        COUNT(*) as count
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      GROUP BY pattern_type
      `,
      [startTime, endTime]
    )

    // Get patterns by severity
    const bySeverityResult = await pool.query(
      `
      SELECT
        severity,
        COUNT(*) as count
      FROM pattern_detections
      WHERE detected_at >= $1 AND detected_at <= $2
      GROUP BY severity
      `,
      [startTime, endTime]
    )

    // Get recent detections
    const recentResult = await pool.query(
      `
      SELECT
        pd.project_id,
        p.name as project_name,
        p.organization,
        pd.pattern_type,
        pd.severity,
        pd.occurrence_count,
        pd.description,
        pd.detected_at
      FROM pattern_detections pd
      JOIN projects p ON pd.project_id = p.id
      WHERE pd.detected_at >= $1 AND pd.detected_at <= $2
      ORDER BY pd.detected_at DESC
      LIMIT 20
      `,
      [startTime, endTime]
    )

    return {
      total: parseInt(totalResult.rows[0].count),
      by_type: byTypeResult.rows.reduce(
        (acc: Record<string, number>, row: { pattern_type: string; count: string }) => {
          acc[row.pattern_type] = parseInt(row.count)
          return acc
        },
        {}
      ),
      by_severity: bySeverityResult.rows.reduce(
        (acc: Record<string, number>, row: { severity: string; count: string }) => {
          acc[row.severity] = parseInt(row.count)
          return acc
        },
        {}
      ),
      recent: recentResult.rows.map((row) => ({
        project_id: row.project_id,
        project_name: row.project_name,
        organization: row.organization,
        pattern_type: row.pattern_type,
        severity: row.severity,
        occurrence_count: parseInt(row.occurrence_count),
        description: row.description,
        detected_at: row.detected_at,
      })),
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching pattern stats:', error)
    return {
      total: 0,
      by_type: {},
      by_severity: {},
      recent: [],
    }
  }
}
