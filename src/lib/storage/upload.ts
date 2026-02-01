/**
 * Storage Upload Module
 *
 * Handles file uploads with automatic routing to Telegram or Cloudinary.
 */

import { uploadFile, shouldUseCloudinary, MAX_FILE_SIZE, type StorageBackend, type UploadResult } from './client'
import { createStorageFile, getStorageUsage } from './metadata'

/**
 * Upload options with metadata tracking
 */
export interface FileUploadOptions {
  /** Content-Type of the file */
  contentType?: string
  /** Custom metadata */
  metadata?: Record<string, string>
}

/**
 * Upload result with tracking info
 */
export interface UploadResultWithTracking extends UploadResult {
  /** Project's total storage usage after upload */
  totalUsage: number
}

/**
 * Upload a file to storage with metadata tracking
 *
 * Automatically routes to:
 * - Cloudinary for images and media files (with optimization)
 * - Telegram Storage for other files (max 1.5GB)
 *
 * @param projectId - Project ID
 * @param storagePath - Full storage path (e.g., "project-123:/uploads/image.png")
 * @param fileName - Original file name
 * @param fileBuffer - File content as Buffer
 * @param options - Upload options
 * @returns Upload result with tracking
 */
export async function uploadFileWithTracking(
  projectId: number,
  storagePath: string,
  fileName: string,
  fileBuffer: Buffer,
  options: FileUploadOptions = {}
): Promise<UploadResultWithTracking> {
  const contentType = options.contentType || 'application/octet-stream'

  // Determine which backend will be used
  const backend: StorageBackend = shouldUseCloudinary(contentType) ? 'cloudinary' : 'telegram'

  // Validate file size against backend limits
  const maxSize = backend === 'cloudinary' ? MAX_FILE_SIZE.cloudinary : MAX_FILE_SIZE.telegram
  if (fileBuffer.length > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
    const maxSizeGB = (maxSize / 1024 / 1024 / 1024).toFixed(1)
    const formattedSize = backend === 'cloudinary' ? `${maxSizeMB}MB` : `${maxSizeGB}GB`

    throw new Error(
      `File size exceeds ${backend} limit of ${formattedSize}. ` +
      `Your file is ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB.`
    )
  }

  // Upload to appropriate backend
  const uploadResult = await uploadFile(storagePath, fileBuffer, contentType, fileName)

  // Create metadata record
  await createStorageFile(
    projectId,
    storagePath,
    fileName,
    uploadResult.size,
    uploadResult.contentType,
    uploadResult.backend,
    uploadResult.id,
    uploadResult.url,
    uploadResult.metadata?.etag as string || undefined,
    {
      ...options.metadata,
      ...uploadResult.metadata,
    }
  )

  // Get updated storage usage
  const totalUsage = await getStorageUsage(projectId)

  return {
    ...uploadResult,
    totalUsage,
  }
}

/**
 * Get the maximum file size for a given content type
 *
 * @param contentType - MIME type
 * @returns Maximum file size in bytes
 */
export function getMaxFileSize(contentType: string): number {
  return shouldUseCloudinary(contentType) ? MAX_FILE_SIZE.cloudinary : MAX_FILE_SIZE.telegram
}

/**
 * Get the maximum file size for a given backend
 *
 * @param backend - Storage backend
 * @returns Maximum file size in bytes
 */
export function getMaxFileSizeForBackend(backend: StorageBackend): number {
  return MAX_FILE_SIZE[backend]
}

/**
 * Validate file name
 *
 * @param fileName - File name to validate
 * @returns True if valid
 */
export function validateFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') {
    return false
  }

  // Check length
  if (fileName.length > 255) {
    return false
  }

  // Check for invalid characters
  const invalidChars = ['/', '\\', '\0', '..', '<', '>', ':', '|', '?', '*']
  for (const char of invalidChars) {
    if (fileName.includes(char)) {
      return false
    }
  }

  // Check for reserved names
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ]

  const baseName = fileName.split('.')[0].toUpperCase()
  if (reservedNames.includes(baseName)) {
    return false
  }

  return true
}

/**
 * Sanitize file name
 *
 * @param fileName - File name to sanitize
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Replace invalid characters with underscore
  return fileName
    .replace(/[\/\\<>:|?*\0]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255)
}

/**
 * Extract file extension from file name
 *
 * @param fileName - File name
 * @returns File extension (without dot)
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : ''
}

/**
 * Get content type from file extension
 *
 * @param extension - File extension (with or without dot)
 * @returns MIME type or undefined
 */
export function getContentTypeFromExtension(extension: string): string | undefined {
  const ext = extension.startsWith('.') ? extension.substring(1) : extension.toLowerCase()

  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',

    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/mov',
    'avi': 'video/avi',
    'mkv': 'video/mkv',

    // Audio
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/m4a',

    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
  }

  return mimeTypes[ext]
}

/**
 * Check if a content type is an image
 *
 * @param contentType - MIME type
 * @returns True if image
 */
export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith('image/')
}

/**
 * Check if a content type is a video
 *
 * @param contentType - MIME type
 * @returns True if video
 */
export function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith('video/')
}

/**
 * Check if a content type is an audio file
 *
 * @param contentType - MIME type
 * @returns True if audio
 */
export function isAudioContentType(contentType: string): boolean {
  return contentType.startsWith('audio/')
}
