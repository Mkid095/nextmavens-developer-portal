/**
 * Access Project Service - Access History
 *
 * US-008: Implement Access Any Project Power
 */

import { getPool } from '@/lib/db'
import { AdminActionType } from '../admin-database/types'
import type { AccessHistoryEntry } from './types'

/**
 * Get access history for a project
 *
 * @param projectId - Project ID to query
 * @returns Array of access history entries
 *
 * @example
 * ```typescript
 * const history = await getAccessHistory('proj-123');
 * console.log('Project accessed:', history.length, 'times via break glass');
 * ```
 */
export async function getAccessHistory(projectId: string): Promise<AccessHistoryEntry[]> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      aa.id,
      aa.session_id,
      s.admin_id,
      s.reason as session_reason,
      aa.created_at as accessed_at,
      (SELECT details->>'ip_address' FROM audit_logs WHERE (details->>'admin_action_id') = aa.id LIMIT 1) as ip_address,
      (SELECT details->>'user_agent' FROM audit_logs WHERE (details->>'admin_action_id') = aa.id LIMIT 1) as user_agent
    FROM control_plane.admin_actions aa
    JOIN control_plane.admin_sessions s ON s.id = aa.session_id
    WHERE aa.action = $1
      AND aa.target_type = 'project'
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
    `,
    [AdminActionType.ACCESS_PROJECT, projectId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    admin_id: row.admin_id,
    session_reason: row.session_reason,
    accessed_at: row.accessed_at,
    ip_address: row.ip_address || undefined,
    user_agent: row.user_agent || undefined,
  }));
}
