/**
 * Auto-Activation Job Module - Database Queries
 */

import { getPool } from '@/lib/db'
import type { CreatedProject, ProjectReadyForActivation } from './types'
import { SQL_QUERIES } from './constants'

/**
 * Get all projects in CREATED status
 */
export async function getCreatedProjects(): Promise<CreatedProject[]> {
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.GET_CREATED_PROJECTS)
  return result.rows
}

/**
 * Activate a project by setting status to 'active'
 */
export async function activateProject(projectId: string): Promise<void> {
  const pool = getPool()
  await pool.query(SQL_QUERIES.ACTIVATE_PROJECT, [projectId])
}

/**
 * Get projects that are ready for activation
 *
 * This is useful for monitoring and dashboards to show which projects
 * will be auto-activated.
 *
 * @returns Array of projects with complete provisioning but still in CREATED status
 */
export async function getProjectsReadyForActivation(): Promise<ProjectReadyForActivation[]> {
  const pool = getPool()

  try {
    const result = await pool.query(SQL_QUERIES.GET_PROJECTS_READY_FOR_ACTIVATION)

    return result.rows.map((row: any) => ({
      projectId: row.project_id,
      projectName: row.project_name,
      ownerName: row.owner_name,
      createdAt: new Date(row.created_at),
    }))
  } catch (error) {
    console.error('[Auto-Activation Job] Error getting projects ready for activation:', error)
    return []
  }
}
