/**
 * Storage Metadata Query Operations
 */

import { getPool } from '@/lib/db'
import type { StorageBackend } from '../client'
import type { StorageFile } from './types'

export async function listStorageFiles(
  projectId: number,
  limit: number = 100,
  offset: number = 0
): Promise<StorageFile[]> {
  const pool = getPool()
  const result = await pool.query<StorageFile>(
    `SELECT * FROM control_plane.storage_files
     WHERE project_id = $1 ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3`,
    [projectId, limit, offset]
  )
  return result.rows
}

export async function listStorageFilesByPath(
  projectId: number,
  pathPrefix: string,
  limit: number = 100
): Promise<StorageFile[]> {
  const pool = getPool()
  const result = await pool.query<StorageFile>(
    `SELECT * FROM control_plane.storage_files
     WHERE project_id = $1 AND storage_path LIKE $2
     ORDER BY uploaded_at DESC LIMIT $3`,
    [projectId, `${pathPrefix}%`, limit]
  )
  return result.rows
}

export async function listStorageFilesByBackend(
  projectId: number,
  backend: StorageBackend,
  limit: number = 100
): Promise<StorageFile[]> {
  const pool = getPool()
  const result = await pool.query<StorageFile>(
    `SELECT * FROM control_plane.storage_files
     WHERE project_id = $1 AND backend = $2
     ORDER BY uploaded_at DESC LIMIT $3`,
    [projectId, backend, limit]
  )
  return result.rows
}
