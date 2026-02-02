/**
 * Authentication Database Operations
 */

import { getPool } from '../db'
import type { JwtPayload } from './types'
import type { Developer } from './types'
import { checkProjectStatus } from './status'

export async function getDeveloperByEmail(email: string): Promise<Developer | null> {
  const pool = getPool()
  const result = await pool.query<Developer>(
    'SELECT * FROM developers WHERE email = $1',
    [email]
  )
  return result.rows[0] || null
}

export async function getDeveloperById(id: string): Promise<Developer | null> {
  const pool = getPool()
  const result = await pool.query<Developer>(
    'SELECT * FROM developers WHERE id = $1',
    [id]
  )
  return result.rows[0] || null
}

export async function validateDeveloperForProject(developerId: string, projectId: string): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    `SELECT id FROM developer_projects WHERE developer_id = $1 AND project_id = $2`,
    [developerId, projectId]
  )
  return result.rows.length > 0
}
