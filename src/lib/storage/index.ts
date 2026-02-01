/**
 * Storage Service
 *
 * Main export module for storage operations.
 * Provides a unified interface for file upload, download, and management
 * using Telegram Storage API (for general files, max 1.5GB) and Cloudinary (for images/media).
 *
 * @example
 * ```typescript
 * import {
 *   uploadFileWithTracking,
 *   downloadFileFromStorage,
 *   deleteFileFromStorage,
 *   getFileUrl,
 *   getStorageStats,
 * } from '@/lib/storage'
 *
 * // Upload a document (uses Telegram)
 * const result = await uploadFileWithTracking(
 *   'project-123',
 *   'project-123:/uploads/report.pdf',
 *   'report.pdf',
 *   fileBuffer,
 *   { contentType: 'application/pdf' }
 * )
 *
 * // Upload an image (uses Cloudinary with optimization)
 * const imageResult = await uploadFileWithTracking(
 *   'project-123',
 *   'project-123:/uploads/photo.jpg',
 *   'photo.jpg',
 *   imageBuffer,
 *   { contentType: 'image/jpeg' }
 * )
 *
 * // Download a file
 * const { data, contentType } = await downloadFileFromStorage(
 *   'project-123:/uploads/report.pdf'
 * )
 *
 * // Get file URL for direct access
 * const url = await getFileUrl('project-123:/uploads/photo.jpg')
 *
 * // Get storage statistics
 * const stats = await getStorageStats('project-123')
 * ```
 */

// ============================================================================
// Client exports (Telegram & Cloudinary APIs)
// ============================================================================

export {
  uploadFile,
  uploadToTelegram,
  uploadToCloudinary,
  downloadFile,
  downloadFromTelegram,
  getTelegramFileInfo,
  getCloudinaryUrl,
  deleteFile,
  deleteFromTelegram,
  deleteFromCloudinary,
  fileExists,
  listTelegramFiles,
  shouldUseCloudinary,
  shouldUseTelegram,
  type TelegramFileResponse,
  type CloudinaryUploadResponse,
  type UploadResult,
  type StorageBackend,
} from './client'

export { MAX_FILE_SIZE, CLOUDINARY_MIME_TYPES } from './client'

// ============================================================================
// Metadata exports (Database operations)
// ============================================================================

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
// Upload exports
// ============================================================================

export {
  uploadFileWithTracking,
  getMaxFileSize,
  getMaxFileSizeForBackend,
  validateFileName,
  sanitizeFileName,
  getFileExtension,
  getContentTypeFromExtension,
  isImageContentType,
  isVideoContentType,
  isAudioContentType,
  type FileUploadOptions,
  type UploadResultWithTracking,
} from './upload'

// ============================================================================
// Download exports
// ============================================================================

export {
  downloadFileFromStorage,
  fileExistsInStorage,
  getFileMetadata,
  getFileInfo,
  getFileUrl,
  getFilesInfo,
  type DownloadResult,
  type DownloadOptions,
} from './download'

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Delete a file from both storage backend and metadata database
 *
 * @param storagePath - Full storage path
 * @returns True if deleted successfully
 */
export async function deleteFileFromStorage(storagePath: string): Promise<boolean> {
  const { deleteFile: deleteFromBackend } = await import('./client')
  const { deleteStorageFile: deleteFromDatabase, getStorageFile } = await import('./metadata')

  // Get file record to know which backend to use
  const fileRecord = await getStorageFile(storagePath)
  if (!fileRecord) {
    return false
  }

  // Delete from storage backend
  await deleteFromBackend(fileRecord.file_id, fileRecord.backend)

  // Delete from database
  return deleteFromDatabase(storagePath)
}

/**
 * List files for a project with metadata
 *
 * @param projectId - Project ID
 * @param pathPrefix - Optional path prefix (e.g., "/uploads")
 * @param limit - Maximum number of files to return (default: 100)
 * @returns Array of file records with metadata
 */
export async function listFilesWithMetadata(
  projectId: number,
  pathPrefix: string = '',
  limit: number = 100
) {
  const { listStorageFiles, listStorageFilesByPath } = await import('./metadata')

  if (pathPrefix) {
    // Build full storage path prefix
    const fullPath = `${projectId}:${pathPrefix.startsWith('/') ? pathPrefix : `/${pathPrefix}`}`
    return listStorageFilesByPath(projectId, fullPath, limit)
  }

  return listStorageFiles(projectId, limit)
}

/**
 * List files by backend type for a project
 *
 * @param projectId - Project ID
 * @param backend - Storage backend ('telegram' or 'cloudinary')
 * @param limit - Maximum number of files to return (default: 100)
 * @returns Array of file records
 */
export async function listFilesByBackend(
  projectId: number,
  backend: StorageBackend,
  limit: number = 100
) {
  const { listStorageFilesByBackend } = await import('./metadata')
  return listStorageFilesByBackend(projectId, backend, limit)
}
