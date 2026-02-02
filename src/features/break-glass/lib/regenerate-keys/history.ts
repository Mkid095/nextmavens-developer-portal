/**
 * Regenerate Keys History
 */

import { getPool } from '@/lib/db'
import { AdminActionType } from '../admin-database'
import type { RegenerateKeysActionLog } from '../types/regenerate-keys.types'

/**
 * Get regenerate keys operation history for a project
 *
 * @param projectId - Project ID to query
 * @returns Array of regenerate keys actions performed on this project
 */
export async function getRegenerateKeysHistory(
  projectId: string
): Promise<RegenerateKeysActionLog[]> {
  const pool = getPool()

  const result = await pool.query(
    `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.before_state,
      aa.after_state,
      aa.created_at
    FROM control_plane.admin_actions aa
    WHERE aa.action = $1
      AND aa.target_type = 'api_key'
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
    `,
    [AdminActionType.REGENERATE_KEYS, projectId]
  )

  return result.rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    before_state: row.before_state as Record<string, unknown>,
    after_state: row.after_state as Record<string, unknown>,
    logged_at: row.created_at,
  }))
}
