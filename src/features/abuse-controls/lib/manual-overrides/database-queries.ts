/**
 * Manual Overrides Database Queries Module
 *
 * Provides read-only database operations for manual overrides.
 * Handles queries for override records, history, and statistics.
 */

import { getPool } from '@/lib/db'
import {
  ManualOverrideAction,
  OverrideRecord,
  ProjectStatus,
  HardCapType,
} from '../../types'

/**
 * Get override history for a project
 *
 * @param projectId - The project to get history for
 * @param limit - Maximum number of records to return
 * @returns Array of override records
 */
export async function getOverrideHistory(
  projectId: string,
  limit: number = 50
): Promise<OverrideRecord[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id, project_id, action, reason, notes, previous_caps, new_caps,
        performed_by, performed_at, ip_address, previous_status, new_status
      FROM manual_overrides
      WHERE project_id = $1
      ORDER BY performed_at DESC
      LIMIT $2
      `,
      [projectId, limit]
    )

    return result.rows.map((row) => mapRowToOverrideRecord(row))
  } catch (error) {
    console.error('[Manual Overrides] Error getting override history:', error)
    throw new Error('Failed to get override history')
  }
}

/**
 * Get overrides by project (alias for getOverrideHistory)
 *
 * @param projectId - The project to get overrides for
 * @param limit - Maximum number of records to return
 * @returns Array of override records
 */
export async function getProjectOverrides(
  projectId: string,
  limit: number = 50
): Promise<OverrideRecord[]> {
  return getOverrideHistory(projectId, limit)
}

/**
 * Get all overrides across all projects (for admin)
 *
 * @param limit - Maximum number of records to return
 * @param offset - Number of records to skip
 * @returns Array of override records
 */
export async function getAllOverrides(
  limit: number = 100,
  offset: number = 0
): Promise<OverrideRecord[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        mo.id, mo.project_id, mo.action, mo.reason, mo.notes,
        mo.previous_caps, mo.new_caps,
        mo.performed_by, mo.performed_at, mo.ip_address,
        mo.previous_status, mo.new_status,
        p.project_name
      FROM manual_overrides mo
      JOIN projects p ON mo.project_id = p.id
      ORDER BY mo.performed_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    )

    return result.rows.map((row) => mapRowToOverrideRecord(row))
  } catch (error) {
    console.error('[Manual Overrides] Error getting all overrides:', error)
    throw new Error('Failed to get all overrides')
  }
}

/**
 * Get override statistics
 *
 * @returns Statistics about overrides
 */
export async function getOverrideStatistics(): Promise<{
  total: number
  byAction: Record<string, number>
  recentCount: number
}> {
  const pool = getPool()

  try {
    // Get total count
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM manual_overrides
      `
    )

    const total = parseInt(totalResult.rows[0].count)

    // Get count by action
    const byActionResult = await pool.query(
      `
      SELECT action, COUNT(*) as count
      FROM manual_overrides
      GROUP BY action
      `
    )

    const byAction: Record<string, number> = {}
    for (const row of byActionResult.rows) {
      byAction[row.action] = parseInt(row.count)
    }

    // Get recent count (last 7 days)
    const recentResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM manual_overrides
      WHERE performed_at >= NOW() - INTERVAL '7 days'
      `
    )

    const recentCount = parseInt(recentResult.rows[0].count)

    return {
      total,
      byAction,
      recentCount,
    }
  } catch (error) {
    console.error('[Manual Overrides] Error getting override statistics:', error)
    throw new Error('Failed to get override statistics')
  }
}

/**
 * Get a specific override by ID
 *
 * @param overrideId - The override ID
 * @returns The override record or null if not found
 */
export async function getOverrideById(
  overrideId: string
): Promise<OverrideRecord | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id, project_id, action, reason, notes, previous_caps, new_caps,
        performed_by, performed_at, ip_address, previous_status, new_status
      FROM manual_overrides
      WHERE id = $1
      `,
      [overrideId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return mapRowToOverrideRecord(result.rows[0])
  } catch (error) {
    console.error('[Manual Overrides] Error getting override by ID:', error)
    throw new Error('Failed to get override')
  }
}

/**
 * Map database row to OverrideRecord
 *
 * @param row - Database row
 * @returns OverrideRecord
 */
function mapRowToOverrideRecord(row: any): OverrideRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    action: row.action as ManualOverrideAction,
    reason: row.reason,
    notes: row.notes || undefined,
    previous_caps: row.previous_caps as Record<HardCapType, number>,
    new_caps: row.new_caps as Record<HardCapType, number> | undefined,
    performed_by: row.performed_by,
    performed_at: row.performed_at,
    ip_address: row.ip_address || undefined,
    previous_status: row.previous_status as ProjectStatus,
    new_status: row.new_status as ProjectStatus,
  }
}
