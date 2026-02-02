/**
 * Manual Overrides Database Module
 *
 * Provides database operations for manual overrides.
 * Re-exports all database functions from sub-modules.
 */

// Query operations
export {
  getOverrideHistory,
  getProjectOverrides,
  getAllOverrides,
  getOverrideStatistics,
  getOverrideById,
} from './database-queries'

// Write operations
export { createOverrideRecord } from './database-writes'

// Project state operations
import { getPool } from '@/lib/db'
import { ProjectStatus, HardCapType } from '../../types'
import { getProjectQuotas } from '../quotas'

/**
 * Get current project status from database
 *
 * @param projectId - The project ID to check
 * @returns Current project status
 */
export async function getProjectStatus(projectId: string): Promise<ProjectStatus> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT status
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      throw new Error('Project not found')
    }

    return result.rows[0].status as ProjectStatus
  } catch (error) {
    console.error('[Manual Overrides] Error getting project status:', error)
    throw new Error('Failed to get project status')
  }
}

/**
 * Get all caps for a project as a record
 *
 * @param projectId - The project ID
 * @returns Record of all cap types and their values
 */
export async function getAllCaps(projectId: string): Promise<Record<HardCapType, number>> {
  const quotas = await getProjectQuotas(projectId)
  const caps: Record<HardCapType, number> = {} as Record<HardCapType, number>

  // Initialize with defaults
  for (const capType of Object.values(HardCapType)) {
    caps[capType] = 0
  }

  // Fill in actual values
  for (const quota of quotas) {
    caps[quota.cap_type as HardCapType] = quota.cap_value
  }

  return caps
}
