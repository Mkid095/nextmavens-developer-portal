/**
 * Cloudinary Storage Operations
 *
 * Upload, delete, and get URLs for images and media files.
 */

import { extractStoragePath } from '@/lib/middleware/storage-scope'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Cloudinary configuration
 */
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || ''

/**
 * Maximum file size for Cloudinary (in bytes)
 */
export const MAX_FILE_SIZE_CLOUDINARY = 10 * 1024 * 1024 // 10MB (Cloudinary free tier)

// ============================================================================
// TYPES
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

// ============================================================================
// OPERATIONS
// ============================================================================

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
  if (buffer.length > MAX_FILE_SIZE_CLOUDINARY) {
    throw new Error(
      `File size exceeds Cloudinary limit of ${MAX_FILE_SIZE_CLOUDINARY} bytes`
    )
  }

  // Extract folder path from storage path
  const pathPart = extractStoragePath(storagePath) || ''
  const folder = pathPart.substring(0, pathPart.lastIndexOf('/')) || 'uploads'

  // Create FormData for Cloudinary upload
  const formData = new FormData()
  // Convert Buffer to Uint8Array then to Blob to avoid SharedArrayBuffer issue
  const uint8Array = new Uint8Array(buffer)
  formData.append('file', new Blob([uint8Array], { type: contentType }))
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
