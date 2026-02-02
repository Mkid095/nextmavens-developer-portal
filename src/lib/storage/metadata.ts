/**
 * Storage File Metadata
 *
 * Database operations for tracking uploaded files.
 * Stores file metadata in the control_plane.storage_files table.
 *
 * Migration required: 028_create_storage_files_table.sql
 */

import { getPool } from '@/lib/db'
import type { StorageBackend } from './client'

/**
 * Storage file record
 */
export interface StorageFile {
  id: string
  project_id: number
  storage_path: string
  file_name: string
  file_size: number
  content_type: string
  backend: StorageBackend
  file_id: string // Telegram file ID or Cloudinary public_id
  file_url: string
  etag?: string
  metadata?: Record<string, unknown>
  uploaded_at: Date
}

/**
 * Create storage file record
 *
 * @param projectId - Project ID
 * @param storagePath - Full storage path (e.g., "project-123:/uploads/image.png")
 * @param fileName - Original file name
 * @param fileSize - File size in bytes
 * @param contentType - MIME type
 * @param backend - Storage backend used
 * @param fileId - File ID from backend
 * @param fileUrl - File URL
 * @param etag - ETag (optional)
 * @param metadata - Additional metadata (optional)
 * @returns Created file record
 */
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
    `
    INSERT INTO control_plane.storage_files (
      project_id,
      storage_path,
      file_name,
      file_size,
      content_type,
      backend,
      file_id,
      file_url,
      etag,
      metadata,
      uploaded_at
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
    RETURNING *
    `,
    [
      projectId,
      storagePath,
      fileName,
      fileSize,
      contentType,
      backend,
      fileId,
      fileUrl,
      etag || null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  )

  console.log('[Storage Metadata] File record created', {
    projectId,
    storagePath,
    fileName,
    fileSize,
    contentType,
    backend,
    fileId,
  })

  return result.rows[0]
}

/**
 * Get storage file by storage path
 *
 * @param storagePath - Full storage path
 * @returns File record or null
 */
export async function getStorageFile(storagePath: string): Promise<StorageFile | null> {
  const pool = getPool()

  const result = await pool.query<StorageFile>(
    `
    SELECT * FROM control_plane.storage_files
    WHERE storage_path = $1
    `,
    [storagePath]
  )

  return result.rows[0] || null
}

/**
 * Get storage file by ID
 *
 * @param fileId - File ID
 * @returns File record or null
 */
export async function getStorageFileById(fileId: string): Promise<StorageFile | null> {
  const pool = getPool()

  const result = await pool.query<StorageFile>(
    `
    SELECT * FROM control_plane.storage_files
    WHERE id = $1
    `,
    [fileId]
  )

  return result.rows[0] || null
}

/**
 * List all files for a project
 *
 * @param projectId - Project ID
 * @param limit - Maximum number of files to return (default: 100)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of file records
 */
export async function listStorageFiles(
  projectId: number,
  limit: number = 100,
  offset: number = 0
): Promise<StorageFile[]> {
  const pool = getPool()

  const result = await pool.query<StorageFile>(
    `
    SELECT * FROM control_plane.storage_files
    WHERE project_id = $1
    ORDER BY uploaded_at DESC
    LIMIT $2 OFFSET $3
    `,
    [projectId, limit, offset]
  )

  return result.rows
}

/**
 * List files by path prefix
 *
 * @param projectId - Project ID
 * @param pathPrefix - Path prefix to filter by (e.g., "project-123:/uploads")
 * @param limit - Maximum number of files to return (default: 100)
 * @returns Array of file records
 */
export async function listStorageFilesByPath(
  projectId: number,
  pathPrefix: string,
  limit: number = 100
): Promise<StorageFile[]> {
  const pool = getPool()

  const result = await pool.query<StorageFile>(
    `
    SELECT * FROM control_plane.storage_files
    WHERE project_id = $1
      AND storage_path LIKE $2
    ORDER BY uploaded_at DESC
    LIMIT $3
    `,
    [projectId, `${pathPrefix}%`, limit]
  )

  return result.rows
}

/**
 * List files by backend type
 *
 * @param projectId - Project ID
 * @param backend - Storage backend
 * @param limit - Maximum number of files to return (default: 100)
 * @returns Array of file records
 */
export async function listStorageFilesByBackend(
  projectId: number,
  backend: StorageBackend,
  limit: number = 100
): Promise<StorageFile[]> {
  const pool = getPool()

  const result = await pool.query<StorageFile>(
    `
    SELECT * FROM control_plane.storage_files
    WHERE project_id = $1
      AND backend = $2
    ORDER BY uploaded_at DESC
    LIMIT $3
    `,
    [projectId, backend, limit]
  )

  return result.rows
}

/**
 * Update file metadata
 *
 * @param storagePath - Full storage path
 * @param metadata - New metadata
 * @returns Updated file record
 */
export async function updateStorageFileMetadata(
  storagePath: string,
  metadata: Record<string, unknown>
): Promise<StorageFile | null> {
  const pool = getPool()

  const result = await pool.query<StorageFile>(
    `
    UPDATE control_plane.storage_files
    SET metadata = $2
    WHERE storage_path = $1
    RETURNING *
    `,
    [storagePath, JSON.stringify(metadata)]
  )

  return result.rows[0] || null
}

/**
 * Delete storage file record
 *
 * @param storagePath - Full storage path
 * @returns True if deleted
 */
export async function deleteStorageFile(storagePath: string): Promise<boolean> {
  const pool = getPool()

  const result = await pool.query(
    `
    DELETE FROM control_plane.storage_files
    WHERE storage_path = $1
    RETURNING id
    `,
    [storagePath]
  )

  const deleted = result.rows.length > 0

  if (deleted) {
    console.log('[Storage Metadata] File record deleted', { storagePath })
  }

  return deleted
}

/**
 * Get total storage usage for a project
 *
 * @param projectId - Project ID
 * @returns Total bytes used
 */
export async function getStorageUsage(projectId: number): Promise<number> {
  const pool = getPool()

  const result = await pool.query<{ total: bigint }>(
    `
    SELECT COALESCE(SUM(file_size), 0) as total
    FROM control_plane.storage_files
    WHERE project_id = $1
    `,
    [projectId]
  )

  return Number(result.rows[0].total)
}

/**
 * Get storage usage by backend
 *
 * @param projectId - Project ID
 * @returns Usage by backend
 */
export async function getStorageUsageByBackend(projectId: number): Promise<{
  telegram: number
  cloudinary: number
  total: number
}> {
  const pool = getPool()

  const result = await pool.query<{ backend: StorageBackend; total: bigint }>(
    `
    SELECT backend, COALESCE(SUM(file_size), 0) as total
    FROM control_plane.storage_files
    WHERE project_id = $1
    GROUP BY backend
    `,
    [projectId]
  )

  const usage = {
    telegram: 0,
    cloudinary: 0,
    total: 0,
  }

  for (const row of result.rows) {
    const bytes = Number(row.total)
    usage[row.backend] = bytes
    usage.total += bytes
  }

  return usage
}

/**
 * Get file count for a project
 *
 * @param projectId - Project ID
 * @returns Number of files
 */
export async function getStorageFileCount(projectId: number): Promise<number> {
  const pool = getPool()

  const result = await pool.query<{ count: bigint }>(
    `
    SELECT COUNT(*) as count
    FROM control_plane.storage_files
    WHERE project_id = $1
    `,
    [projectId]
  )

  return Number(result.rows[0].count)
}

/**
 * Get storage usage statistics
 *
 * @param projectId - Project ID
 * @returns Storage statistics
 */
export interface StorageStats {
  totalBytes: number
  fileCount: number
  largestFile: { name: string; size: number; backend: StorageBackend } | null
  averageFileSize: number
  backendBreakdown: {
    telegram: { bytes: number; count: number }
    cloudinary: { bytes: number; count: number }
  }
}

export async function getStorageStats(projectId: number): Promise<StorageStats> {
  const pool = getPool()

  const result = await pool.query<{
    total_bytes: bigint
    file_count: bigint
    largest_file_name: string | null
    largest_file_size: bigint | null
    largest_file_backend: StorageBackend | null
    average_file_size: number
    telegram_bytes: bigint
    telegram_count: bigint
    cloudinary_bytes: bigint
    cloudinary_count: bigint
  }>(
    `
    SELECT
      COALESCE(SUM(file_size), 0) as total_bytes,
      COUNT(*) as file_count,
      MAX(file_name) as largest_file_name,
      MAX(file_size) as largest_file_size,
      MAX(backend) as largest_file_backend,
      COALESCE(AVG(file_size), 0) as average_file_size,
      COALESCE(SUM(CASE WHEN backend = 'telegram' THEN file_size ELSE 0 END), 0) as telegram_bytes,
      COALESCE(COUNT(CASE WHEN backend = 'telegram' THEN 1 END), 0) as telegram_count,
      COALESCE(SUM(CASE WHEN backend = 'cloudinary' THEN file_size ELSE 0 END), 0) as cloudinary_bytes,
      COALESCE(COUNT(CASE WHEN backend = 'cloudinary' THEN 1 END), 0) as cloudinary_count
    FROM control_plane.storage_files
    WHERE project_id = $1
    `,
    [projectId]
  )

  const row = result.rows[0]

  return {
    totalBytes: Number(row.total_bytes),
    fileCount: Number(row.file_count),
    largestFile: row.largest_file_name
      ? {
          name: row.largest_file_name,
          size: Number(row.largest_file_size),
          backend: row.largest_file_backend || 'telegram',
        }
      : null,
    averageFileSize: Number(row.average_file_size),
    backendBreakdown: {
      telegram: {
        bytes: Number(row.telegram_bytes),
        count: Number(row.telegram_count),
      },
      cloudinary: {
        bytes: Number(row.cloudinary_bytes),
        count: Number(row.cloudinary_count),
      },
    },
  }
}

/**
 * Delete all files for a project
 *
 * @param projectId - Project ID
 * @returns Number of files deleted
 */
export async function deleteProjectFiles(projectId: number): Promise<number> {
  const pool = getPool()

  const result = await pool.query<{ count: bigint }>(
    `
    DELETE FROM control_plane.storage_files
    WHERE project_id = $1
    RETURNING COUNT(*) as count
    `,
    [projectId]
  )

  const count = Number(result.rows[0].count)

  console.log('[Storage Metadata] Deleted all project files', {
    projectId,
    count,
  })

  return count
}
