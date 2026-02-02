/**
 * Storage Metadata CRUD Operations
 */

import { getPool } from '@/lib/db'
import type { StorageBackend } from '../client'
import type { StorageFile } from './types'

export async function createStorageFile(
  projectId: number,
  storagePath: string,
  fileName: string,
  fileSize: number,
  contentType: string,
  backend: StorageBackend,
  fileId: string,
  fileUrl: string,
  etag?: string,
  metadata?: Record<string, unknown>
): Promise<StorageFile> {
  const pool = getPool()

  const result = await pool.query<StorageFile>(
    `INSERT INTO control_plane.storage_files (
      project_id, storage_path, file_name, file_size, content_type,
      backend, file_id, file_url, etag, metadata, uploaded_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    ON CONFLICT (storage_path)
    DO UPDATE SET
      file_name = EXCLUDED.file_name,
      file_size = EXCLUDED.file_size,
      content_type = EXCLUDED.content_type,
      backend = EXCLUDED.backend,
      file_id = EXCLUDED.file_id,
      file_url = EXCLUDED.file_url,
      etag = EXCLUDED.etag,
      metadata = EXCLUDED.metadata,
      uploaded_at = NOW()
    RETURNING *`,
    [
      projectId, storagePath, fileName, fileSize, contentType, backend,
      fileId, fileUrl, etag || null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  )

  console.log('[Storage Metadata] File record created', {
    projectId, storagePath, fileName, fileSize, contentType, backend, fileId,
  })

  return result.rows[0]
}

export async function getStorageFile(storagePath: string): Promise<StorageFile | null> {
  const pool = getPool()
  const result = await pool.query<StorageFile>(
    'SELECT * FROM control_plane.storage_files WHERE storage_path = $1',
    [storagePath]
  )
  return result.rows[0] || null
}

export async function getStorageFileById(fileId: string): Promise<StorageFile | null> {
  const pool = getPool()
  const result = await pool.query<StorageFile>(
    'SELECT * FROM control_plane.storage_files WHERE id = $1',
    [fileId]
  )
  return result.rows[0] || null
}

export async function updateStorageFileMetadata(
  storagePath: string,
  metadata: Record<string, unknown>
): Promise<StorageFile | null> {
  const pool = getPool()
  const result = await pool.query<StorageFile>(
    'UPDATE control_plane.storage_files SET metadata = $2 WHERE storage_path = $1 RETURNING *',
    [storagePath, JSON.stringify(metadata)]
  )
  return result.rows[0] || null
}

export async function deleteStorageFile(storagePath: string): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    'DELETE FROM control_plane.storage_files WHERE storage_path = $1 RETURNING id',
    [storagePath]
  )
  const deleted = result.rows.length > 0
  if (deleted) {
    console.log('[Storage Metadata] File record deleted', { storagePath })
  }
  return deleted
}

export async function deleteProjectFiles(projectId: number): Promise<number> {
  const pool = getPool()
  const result = await pool.query<{ count: bigint }>(
    'DELETE FROM control_plane.storage_files WHERE project_id = $1 RETURNING COUNT(*) as count',
    [projectId]
  )
  const count = Number(result.rows[0].count)
  console.log('[Storage Metadata] Deleted all project files', { projectId, count })
  return count
}
