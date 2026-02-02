/**
 * API Metadata Operations
 *
 * Retrieve file metadata and check file existence from storage APIs.
 */

import type { TelegramFileResponse } from './telegram'
import { getCloudinaryUrl } from './cloudinary'
import { getTelegramFileInfo } from './telegram'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Telegram Storage API configuration
 */
const TELEGRAM_API_URL = process.env.TELEGRAM_STORAGE_API_URL || 'https://telegram-api.nextmavens.cloud'
const TELEGRAM_API_KEY = process.env.TELEGRAM_STORAGE_API_KEY || ''

// ============================================================================
// METADATA TYPES
// ============================================================================

/**
 * Storage backend type
 */
export type StorageBackend = 'telegram' | 'cloudinary'

/**
 * Unified file metadata
 */
export interface FileMetadata {
  /** Which backend was used */
  backend: StorageBackend
  /** File ID (Telegram) or public_id (Cloudinary) */
  id: string
  /** File URL */
  url: string
  /** Download URL */
  downloadUrl?: string
  /** File name */
  name: string
  /** File size in bytes */
  size: number
  /** Content type */
  contentType: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

// Re-export Telegram metadata operations
export { getTelegramFileInfo } from './telegram'

// ============================================================================
// UNIFIED METADATA OPERATIONS
// ============================================================================

/**
 * Check if a file exists
 *
 * @param fileId - File ID
 * @param backend - Storage backend type
 * @returns True if file exists
 */
export async function fileExists(fileId: string, backend: StorageBackend): Promise<boolean> {
  try {
    if (backend === 'telegram') {
      await getTelegramFileInfo(fileId)
      return true
    } else {
      // For Cloudinary, we can try to fetch the URL headers
      const url = getCloudinaryUrl(fileId)
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    }
  } catch {
    return false
  }
}

/**
 * Get unified file metadata
 *
 * @param fileId - File ID
 * @param backend - Storage backend type
 * @returns File metadata
 */
export async function getFileMetadata(
  fileId: string,
  backend: StorageBackend
): Promise<FileMetadata> {
  if (backend === 'telegram') {
    const info = await getTelegramFileInfo(fileId)
    return {
      backend: 'telegram',
      id: info.id,
      url: info.url,
      downloadUrl: info.downloadUrl,
      name: info.name,
      size: info.size,
      contentType: info.mimeType,
      metadata: {
        folder: info.folder,
        createdAt: info.createdAt,
      },
    }
  }

  // For Cloudinary, we have limited metadata without API access
  const url = getCloudinaryUrl(fileId)
  const response = await fetch(url, { method: 'HEAD' })

  if (!response.ok) {
    throw new Error(`Failed to get Cloudinary file metadata: ${response.statusText}`)
  }

  const contentLength = response.headers.get('content-length')
  const contentType = response.headers.get('content-type')

  return {
    backend: 'cloudinary',
    id: fileId,
    url,
    downloadUrl: url,
    name: fileId.split('/').pop() || fileId,
    size: contentLength ? parseInt(contentLength, 10) : 0,
    contentType: contentType || 'application/octet-stream',
  }
}

/**
 * Get file metadata from the appropriate backend (alias for getFileMetadata)
 *
 * @param fileId - File ID
 * @param backend - Storage backend type
 * @returns File metadata
 */
export async function getFileInfo(
  fileId: string,
  backend: StorageBackend
): Promise<FileMetadata> {
  return getFileMetadata(fileId, backend)
}
