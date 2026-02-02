/**
 * Telegram Storage Operations
 *
 * Upload, download, and delete files from Telegram Storage API.
 */

import { extractStoragePath } from '@/lib/middleware/storage-scope'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Telegram Storage API configuration
 */
const TELEGRAM_API_URL = process.env.TELEGRAM_STORAGE_API_URL || 'https://telegram-api.nextmavens.cloud'
const TELEGRAM_API_KEY = process.env.TELEGRAM_STORAGE_API_KEY || ''

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZE_TELEGRAM = 1.5 * 1024 * 1024 * 1024 // 1.5GB

// ============================================================================
// TYPES
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

// ============================================================================
// OPERATIONS
// ============================================================================

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
  if (buffer.length > MAX_FILE_SIZE_TELEGRAM) {
    throw new Error(
      `File size exceeds Telegram limit of ${MAX_FILE_SIZE_TELEGRAM} bytes (${(MAX_FILE_SIZE_TELEGRAM / 1024 / 1024 / 1024).toFixed(1)}GB)`
    )
  }

  // Extract folder path from storage path
  const pathPart = extractStoragePath(storagePath) || ''
  const folder = pathPart.substring(0, pathPart.lastIndexOf('/')) || '/'

  // Create FormData
  const formData = new FormData()
  // Convert Buffer to Uint8Array then to Blob to avoid SharedArrayBuffer issue
  const uint8Array = new Uint8Array(buffer)
  const blob = new Blob([uint8Array], { type: contentType })
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
