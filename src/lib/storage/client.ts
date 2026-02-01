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

/**
 * Telegram Storage API configuration
 */
const TELEGRAM_API_URL = process.env.TELEGRAM_STORAGE_API_URL || 'https://telegram-api.nextmavens.cloud'
const TELEGRAM_API_KEY = process.env.TELEGRAM_STORAGE_API_KEY || ''

/**
 * Cloudinary configuration
 */
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ''
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ''
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || '' // For unsigned uploads

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZE = {
  telegram: 1.5 * 1024 * 1024 * 1024, // 1.5GB
  cloudinary: 10 * 1024 * 1024, // 10MB (Cloudinary free tier)
  multipart: 100 * 1024 * 1024, // 100MB for multipart uploads
}

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
// TELEGRAM STORAGE API
// ============================================================================

/**
 * Telegram file upload response
 */
export interface TelegramFileResponse {
  id: string
  name: string
  size: number
  mimeType: string
  url: string
  downloadUrl: string
  createdAt: string
  folder: string
  metadata?: Record<string, unknown>
}

/**
 * Upload a file to Telegram Storage
 *
 * @param storagePath - Full storage path (e.g., "project-123:/uploads/file.pdf")
 * @param buffer - File content as Buffer
 * @param contentType - MIME type
 * @param fileName - Original file name
 * @returns File response
 */
export async function uploadToTelegram(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
  fileName: string
): Promise<TelegramFileResponse> {
  if (!TELEGRAM_API_KEY) {
    throw new Error('TELEGRAM_STORAGE_API_KEY environment variable is required')
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE.telegram) {
    throw new Error(
      `File size exceeds Telegram limit of ${MAX_FILE_SIZE.telegram} bytes (${(MAX_FILE_SIZE.telegram / 1024 / 1024 / 1024).toFixed(1)}GB)`
    )
  }

  // Extract folder path from storage path
  const pathPart = extractStoragePath(storagePath) || ''
  const folder = pathPart.substring(0, pathPart.lastIndexOf('/')) || '/'

  // Create FormData
  const formData = new FormData()
  const blob = new Blob([buffer], { type: contentType })
  formData.append('file', blob, fileName)
  formData.append('folder', folder)
  formData.append('metadata', JSON.stringify({
    storagePath,
    uploadedAt: new Date().toISOString(),
  }))

  // Upload to Telegram Storage API
  const response = await fetch(`${TELEGRAM_API_URL}/api/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TELEGRAM_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || `Telegram upload failed: ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid response from Telegram API')
  }

  console.log('[Storage] File uploaded to Telegram', {
    id: result.data.id,
    name: result.data.name,
    size: result.data.size,
    folder: result.data.folder,
  })

  return result.data
}

/**
 * Download a file from Telegram Storage
 *
 * @param fileId - Telegram file ID (e.g., "f_abc123xyz456")
 * @returns File content as Buffer
 */
export async function downloadFromTelegram(fileId: string): Promise<{
  data: Buffer
  contentType: string
  fileName: string
}> {
  if (!TELEGRAM_API_KEY) {
    throw new Error('TELEGRAM_STORAGE_API_KEY environment variable is required')
  }

  // Get download URL
  const response = await fetch(`${TELEGRAM_API_URL}/api/files/${fileId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TELEGRAM_API_KEY}`,
    },
    redirect: 'manual', // We'll follow the redirect manually
  })

  if (!response.ok) {
    throw new Error(`Failed to get download URL: ${response.statusText}`)
  }

  // Get the redirect URL (Telegram CDN URL)
  const downloadUrl = response.headers.get('Location') || response.headers.get('location')

  if (!downloadUrl) {
    // If no redirect, get file info first
    const infoResponse = await fetch(`${TELEGRAM_API_URL}/api/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${TELEGRAM_API_KEY}`,
      },
    })

    if (!infoResponse.ok) {
      throw new Error(`Failed to get file info: ${infoResponse.statusText}`)
    }

    const info = await infoResponse.json()
    const finalUrl = info.data?.url || info.data?.downloadUrl

    if (!finalUrl) {
      throw new Error('No download URL available')
    }

    // Download from the CDN URL
    const fileResponse = await fetch(finalUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    const data = Buffer.from(arrayBuffer)

    return {
      data,
      contentType: info.data?.mimeType || 'application/octet-stream',
      fileName: info.data?.name || 'file',
    }
  }

  // Download from redirect URL
  const fileResponse = await fetch(downloadUrl)
  if (!fileResponse.ok) {
    throw new Error(`Failed to download file: ${fileResponse.statusText}`)
  }

  const arrayBuffer = await fileResponse.arrayBuffer()
  const data = Buffer.from(arrayBuffer)

  return {
    data,
    contentType: fileResponse.headers.get('content-type') || 'application/octet-stream',
    fileName: 'file',
  }
}

/**
 * Get file info from Telegram Storage
 *
 * @param fileId - Telegram file ID
 * @returns File metadata
 */
export async function getTelegramFileInfo(fileId: string): Promise<TelegramFileResponse> {
  if (!TELEGRAM_API_KEY) {
    throw new Error('TELEGRAM_STORAGE_API_KEY environment variable is required')
  }

  const response = await fetch(`${TELEGRAM_API_URL}/api/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${TELEGRAM_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get file info: ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid response from Telegram API')
  }

  return result.data
}

/**
 * Delete a file from Telegram Storage
 *
 * @param fileId - Telegram file ID
 */
export async function deleteFromTelegram(fileId: string): Promise<void> {
  if (!TELEGRAM_API_KEY) {
    throw new Error('TELEGRAM_STORAGE_API_KEY environment variable is required')
  }

  const response = await fetch(`${TELEGRAM_API_URL}/api/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${TELEGRAM_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`)
  }

  console.log('[Storage] File deleted from Telegram', { fileId })
}

/**
 * List files from Telegram Storage
 *
 * @param folder - Folder path (e.g., "/uploads")
 * @param limit - Maximum files to return
 * @returns Array of file metadata
 */
export async function listTelegramFiles(
  folder: string,
  limit: number = 100
): Promise<{ files: TelegramFileResponse[]; total: number; hasMore: boolean }> {
  if (!TELEGRAM_API_KEY) {
    throw new Error('TELEGRAM_STORAGE_API_KEY environment variable is required')
  }

  const params = new URLSearchParams({
    folder,
    limit: limit.toString(),
  })

  const response = await fetch(`${TELEGRAM_API_URL}/api/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${TELEGRAM_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Invalid response from Telegram API')
  }

  return result.data
}

// ============================================================================
// CLOUDINARY API
// ============================================================================

/**
 * Cloudinary upload response
 */
export interface CloudinaryUploadResponse {
  public_id: string
  version: number
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  tags: string[]
  bytes: number
  type: string
  etag: string
  placeholder: boolean
  url: string
  secure_url: string
  access_mode: string
  original_filename: string
}

/**
 * Upload an image or media file to Cloudinary
 *
 * @param storagePath - Full storage path (for folder organization)
 * @param buffer - File content as Buffer
 * @param contentType - MIME type
 * @param fileName - Original file name
 * @returns Upload response
 */
export async function uploadToCloudinary(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
  fileName: string
): Promise<CloudinaryUploadResponse> {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME environment variable is required')
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE.cloudinary) {
    throw new Error(
      `File size exceeds Cloudinary limit of ${MAX_FILE_SIZE.cloudinary} bytes`
    )
  }

  // Extract folder path from storage path
  const pathPart = extractStoragePath(storagePath) || ''
  const folder = pathPart.substring(0, pathPart.lastIndexOf('/')) || 'uploads'

  // Create FormData for Cloudinary upload
  const formData = new FormData()
  formData.append('file', new Blob([buffer], { type: contentType }))
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset')
  formData.append('folder', folder)
  formData.append('public_id', `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)

  // Add transformations based on content type
  if (contentType.startsWith('image/')) {
    // Auto-optimize images
    formData.append('transformation', 'f_auto,q_auto')
  } else if (contentType.startsWith('video/')) {
    // Optimize videos
    formData.append('transformation', 'q_auto')
  }

  // Upload to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${contentType.startsWith('video') || contentType.startsWith('audio') ? 'video' : 'image'}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Upload failed' } }))
    throw new Error(error.error?.message || `Cloudinary upload failed: ${response.statusText}`)
  }

  const result = await response.json()

  console.log('[Storage] File uploaded to Cloudinary', {
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  })

  return result
}

/**
 * Get Cloudinary URL for a resource
 *
 * @param publicId - Cloudinary public ID
 * @param transformations - Optional transformations (e.g., "w_500,h_500,c_fill")
 * @returns Cloudinary URL
 */
export function getCloudinaryUrl(publicId: string, transformations?: string): string {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME environment variable is required')
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
  return transformations ? `${baseUrl}/${transformations}/${publicId}` : `${baseUrl}/${publicId}`
}

/**
 * Delete from Cloudinary
 *
 * @param publicId - Cloudinary public ID
 * @param resourceType - Resource type (image, video, raw)
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: string = 'image'
): Promise<void> {
  // Cloudinary requires authentication with API key and secret for deletion
  // For now, we'll use the upload API's delete endpoint if an upload preset is configured
  // In production, you should use the Admin API with proper authentication

  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME environment variable is required')
  }

  console.warn('[Storage] Cloudinary deletion requires Admin API setup', { publicId })
  // TODO: Implement proper Cloudinary Admin API deletion
  // This requires signing requests with API key and secret
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
