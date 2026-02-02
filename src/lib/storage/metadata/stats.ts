/**
 * Storage Metadata Statistics
 */

import { getPool } from '@/lib/db'
import type { StorageBackend } from '../client'
import type { StorageStats } from './types'

export async function getStorageUsage(projectId: number): Promise<number> {
  const pool = getPool()
  const result = await pool.query<{ total: bigint }>(
    'SELECT COALESCE(SUM(file_size), 0) as total FROM control_plane.storage_files WHERE project_id = $1',
    [projectId]
  )
  return Number(result.rows[0].total)
}

export async function getStorageUsageByBackend(projectId: number): Promise<{
  telegram: number
  cloudinary: number
  total: number
}> {
  const pool = getPool()
  const result = await pool.query<{ backend: StorageBackend; total: bigint }>(
    'SELECT backend, COALESCE(SUM(file_size), 0) as total FROM control_plane.storage_files WHERE project_id = $1 GROUP BY backend',
    [projectId]
  )

  const usage = { telegram: 0, cloudinary: 0, total: 0 }
  for (const row of result.rows) {
    const bytes = Number(row.total)
    usage[row.backend] = bytes
    usage.total += bytes
  }
  return usage
}

export async function getStorageFileCount(projectId: number): Promise<number> {
  const pool = getPool()
  const result = await pool.query<{ count: bigint }>(
    'SELECT COUNT(*) as count FROM control_plane.storage_files WHERE project_id = $1',
    [projectId]
  )
  return Number(result.rows[0].count)
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
    `SELECT
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
    FROM control_plane.storage_files WHERE project_id = $1`,
    [projectId]
  )

  const row = result.rows[0]
  return {
    totalBytes: Number(row.total_bytes),
    fileCount: Number(row.file_count),
    largestFile: row.largest_file_name
      ? { name: row.largest_file_name, size: Number(row.largest_file_size), backend: row.largest_file_backend || 'telegram' }
      : null,
    averageFileSize: Number(row.average_file_size),
    backendBreakdown: {
      telegram: { bytes: Number(row.telegram_bytes), count: Number(row.telegram_count) },
      cloudinary: { bytes: Number(row.cloudinary_bytes), count: Number(row.cloudinary_count) },
    },
  }
}
