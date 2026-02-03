/**
 * Grace Period Job - Module - Database Utilities
 */

import type { ProjectRecord } from '../types'
import { JOB_QUERIES } from '../constants'

export async function findProjectsInGracePeriod(pool: any): Promise<ProjectRecord[]> {
  const result = await pool.query(JOB_QUERIES.FIND_PROJECTS)
  return result.rows
}

export async function hardDeleteProjectInTransaction(
  client: any,
  project: { projectId: string; projectSlug: string }
): Promise<void> {
  const { projectId, projectSlug } = project

  // 1. Drop the tenant schema if it exists
  const tenantSchema = `tenant_${projectSlug}`
  try {
    await client.query(`DROP SCHEMA IF EXISTS ${tenantSchema} CASCADE`)
    console.log(`[Hard Delete] Dropped schema ${tenantSchema}`)
  } catch (error) {
    console.warn(`[Hard Delete] Could not drop schema ${tenantSchema}:`, error)
  }

  // 2. Delete related records from control_plane schema
  await client.query('DELETE FROM control_plane.api_keys WHERE project_id = $1', [projectId])
  console.log(`[Hard Delete] Deleted API keys for project ${projectId}`)

  await client.query('DELETE FROM control_plane.webhooks WHERE project_id = $1', [projectId])
  console.log(`[Hard Delete] Deleted webhooks for project ${projectId}`)

  await client.query('DELETE FROM control_plane.edge_functions WHERE project_id = $1', [projectId])
  console.log(`[Hard Delete] Deleted edge functions for project ${projectId}`)

  await client.query('DELETE FROM control_plane.storage_buckets WHERE project_id = $1', [projectId])
  console.log(`[Hard Delete] Deleted storage buckets for project ${projectId}`)

  await client.query('DELETE FROM control_plane.secrets WHERE project_id = $1', [projectId])
  console.log(`[Hard Delete] Deleted secrets for project ${projectId}`)

  // 3. Set deleted_at timestamp on project
  await client.query(
    'UPDATE control_plane.projects SET deleted_at = NOW() WHERE id = $1',
    [projectId]
  )
  console.log(`[Hard Delete] Set deleted_at for project ${projectId}`)
}
