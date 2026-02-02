/**
 * Storage Upload Route - Module - Utility: Get Project ID
 */

import type { AuthenticatedEntity, JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { ERROR_MESSAGES } from '../constants'

export async function getProjectId(auth: AuthenticatedEntity): Promise<string> {
  // JWT authentication has project_id in token
  if ('project_id' in auth && (auth as JwtPayload).project_id) {
    return (auth as JwtPayload).project_id
  }

  // API key authentication - query database for user's project
  const pool = getPool()
  const projectResult = await pool.query(
    'SELECT id FROM projects WHERE developer_id = $1 LIMIT 1',
    [auth.id]
  )

  if (projectResult.rows.length === 0) {
    throw new Error(ERROR_MESSAGES.NO_PROJECT)
  }

  return projectResult.rows[0].id
}
