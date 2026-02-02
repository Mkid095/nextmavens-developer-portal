/**
 * Storage Metadata Types
 */

import type { StorageBackend } from '../client'

export interface StorageFile {
  id: string
  project_id: number
  storage_path: string
  file_name: string
  file_size: number
  content_type: string
  backend: StorageBackend
  file_id: string
  file_url: string
  etag?: string
  metadata?: Record<string, unknown>
  uploaded_at: Date
}

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
