/**
 * Storage Client
 *
 * Dual storage backend:
 * - Telegram Storage API for general files (max 1.5GB)
 * - Cloudinary for images and media (with optimization)
 *
 * @example
 * ```typescript
 * import { uploadFile, downloadFile } from '@/lib/storage/client';
 *
 * // Upload a document (uses Telegram)
 * await uploadFile('project-123:/uploads/report.pdf', buffer, 'application/pdf');
 *
 * // Upload an image (uses Cloudinary)
 * await uploadFile('project-123:/uploads/image.png', buffer, 'image/png');
 * ```
 */

import { extractStoragePath } from '@/lib/middleware/storage-scope'

// Import operations
import {
  uploadToTelegram,
  uploadToCloudinary,
  downloadFromTelegram,
  deleteFromTelegram,
  deleteFromCloudinary,
  getCloudinaryUrl,
  type TelegramFileResponse,
  type CloudinaryUploadResponse,
} from './file-operations'

import { fileExists as checkFileExists } from './api-metadata'

// Re-export file operations
export {
  uploadToTelegram,
  downloadFromTelegram,
  deleteFromTelegram,
  uploadToCloudinary,
  getCloudinaryUrl,
  deleteFromCloudinary,
  MAX_FILE_SIZE,
  type TelegramFileResponse,
  type CloudinaryUploadResponse,
} from './file-operations'

// Re-export bucket operations
export {
  listTelegramFiles,
  listProjectFiles,
  getFolderUsage,
} from './bucket-operations'

// Re-export API metadata operations
export {
  getTelegramFileInfo,
  fileExists,
  getFileMetadata,
  getFileInfo,
} from './api-metadata'

// Re-export database metadata operations
export {
  createStorageFile,
  getStorageFile,
  getStorageFileById,
  listStorageFiles,
  listStorageFilesByPath,
  listStorageFilesByBackend,
  updateStorageFileMetadata,
  deleteStorageFile,
  getStorageUsage,
  getStorageUsageByBackend,
  getStorageFileCount,
  getStorageStats,
  deleteProjectFiles,
  type StorageFile,
  type StorageStats,
} from './metadata'

// ============================================================================
// BACKEND SELECTION
// ============================================================================

/**
 * Image and media MIME types that should use Cloudinary
 */
export const CLOUDINARY_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'video/mp4',
  'video/webm',
  'video/mov',
  'video/avi',
  'video/mkv',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
]

/**
 * Check if a file should use Cloudinary (image or media)
 */
export function shouldUseCloudinary(contentType: string): boolean {
  return CLOUDINARY_MIME_TYPES.includes(contentType.toLowerCase())
}

/**
 * Check if a file should use Telegram Storage
 */
export function shouldUseTelegram(contentType: string): boolean {
  return !shouldUseCloudinary(contentType)
}

// ============================================================================
// UNIFIED STORAGE INTERFACE
// ============================================================================

/**
 * Storage backend type
 */
export type StorageBackend = 'telegram' | 'cloudinary'

/**
 * Unified file upload result
 */
export interface UploadResult {
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

/**
 * Upload a file to the appropriate storage backend
 *
 * Automatically routes to Cloudinary for images/media, Telegram for other files
 *
 * @param storagePath - Full storage path (e.g., "project-123:/uploads/file.pdf")
 * @param buffer - File content
 * @param contentType - MIME type
 * @param fileName - Original file name
 * @returns Upload result
 */
export async function uploadFile(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
  fileName: string
): Promise<UploadResult> {
  // Route to appropriate backend
  if (shouldUseCloudinary(contentType)) {
    const result = await uploadToCloudinary(storagePath, buffer, contentType, fileName)
    return {
      backend: 'cloudinary',
      id: result.public_id,
      url: result.secure_url,
      downloadUrl: result.secure_url,
      name: result.original_filename,
      size: result.bytes,
      contentType,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
      },
    }
  } else {
    const result = await uploadToTelegram(storagePath, buffer, contentType, fileName)
    return {
      backend: 'telegram',
      id: result.id,
      url: result.url,
      downloadUrl: result.downloadUrl,
      name: result.name,
      size: result.size,
      contentType: result.mimeType,
      metadata: {
        folder: result.folder,
        createdAt: result.createdAt,
      },
    }
  }
}

/**
 * Download a file by ID
 *
 * @param fileId - File ID (Telegram) or public_id (Cloudinary)
 * @param backend - Storage backend type
 * @returns File data and metadata
 */
export async function downloadFile(
  fileId: string,
  backend: StorageBackend
): Promise<{ data: Buffer; contentType: string; fileName: string }> {
  if (backend === 'telegram') {
    return downloadFromTelegram(fileId)
  }

  // For Cloudinary, we fetch the URL
  const url = getCloudinaryUrl(fileId)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download from Cloudinary: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const data = Buffer.from(arrayBuffer)

  return {
    data,
    contentType: response.headers.get('content-type') || 'application/octet-stream',
    fileName: 'file',
  }
}

/**
 * Delete a file by ID
 *
 * @param fileId - File ID (Telegram) or public_id (Cloudinary)
 * @param backend - Storage backend type
 */
export async function deleteFile(fileId: string, backend: StorageBackend): Promise<void> {
  if (backend === 'telegram') {
    return deleteFromTelegram(fileId)
  }

  return deleteFromCloudinary(fileId)
}

/**
 * Check if a file exists
 *
 * @param fileId - File ID
 * @param backend - Storage backend type
 * @returns True if file exists
 */
// Note: fileExists is already re-exported from api-metadata above
