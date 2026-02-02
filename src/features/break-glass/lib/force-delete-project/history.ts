/**
 * Force Delete Project Service - History Functions
 *
 * US-006: Implement Force Delete Power - Step 1: Foundation
 */

import { getPool } from '@/lib/db'
import { AdminActionType } from '../admin-database/types'
import type { ForceDeleteActionLog } from './types'

/**
 * Get force delete operation history for a project
 *
 * @param projectId - Project ID to query
 * @returns Array of force delete actions performed on this project
 *
 * @example
 * ```typescript
 * const history = await getForceDeleteHistory('proj-123');
 * console.log('Force delete operations:', history.length);
 * ```
 */
export async function getForceDeleteHistory(projectId: string): Promise<ForceDeleteActionLog[]> {
  const pool = getPool();

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
      AND aa.target_type = 'project'
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
    `,
    [AdminActionType.FORCE_DELETE, projectId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    before_state: row.before_state as Record<string, unknown>,
    after_state: row.after_state as Record<string, unknown>,
    logged_at: row.created_at,
  }));
}
