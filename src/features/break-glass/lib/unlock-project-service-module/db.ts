/**
 * Unlock Project Service - Module - Database Queries
 */

import { QUERIES } from './constants'

export async function getProject(pool: any, projectId: string) {
  const result = await pool.query(QUERIES.GET_PROJECT, [projectId])
  return result.rows[0]
}

export async function updateProjectStatus(pool: any, projectId: string) {
  const result = await pool.query(QUERIES.UPDATE_PROJECT_STATUS, [projectId])
  return result.rows[0]
}

export async function getUnlockHistoryQuery(pool: any, actionType: string, projectId: string) {
  const result = await pool.query(QUERIES.GET_UNLOCK_HISTORY, [actionType, projectId])
  return result.rows
}
