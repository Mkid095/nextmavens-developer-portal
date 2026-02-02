/**
 * Bucket Operations
 *
 * List and manage files in storage buckets/folders.
 */

import type { TelegramFileResponse } from './telegram'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Telegram Storage API configuration
 */
const TELEGRAM_API_URL = process.env.TELEGRAM_STORAGE_API_URL || 'https://telegram-api.nextmavens.cloud'
const TELEGRAM_API_KEY = process.env.TELEGRAM_STORAGE_API_KEY || ''

// ============================================================================
// TELEGRAM BUCKET OPERATIONS
// ============================================================================

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

/**
 * List files from a specific project's storage
 *
 * @param projectId - Project ID
 * @param folder - Optional subfolder path
 * @param limit - Maximum files to return
 * @returns Array of file metadata
 */
export async function listProjectFiles(
  projectId: string,
  folder: string = '/',
  limit: number = 100
): Promise<{ files: TelegramFileResponse[]; total: number; hasMore: boolean }> {
  // Prefix the project ID to create project-scoped folder
  const projectFolder = folder === '/' ? `/${projectId}` : `/${projectId}${folder}`
  return listTelegramFiles(projectFolder, limit)
}

/**
 * Get storage usage statistics for a folder
 *
 * @param folder - Folder path
 * @returns Total files and total size
 */
export async function getFolderUsage(
  folder: string
): Promise<{ fileCount: number; totalSize: number; totalSizeFormatted: string }> {
  const result = await listTelegramFiles(folder, 1000)

  const totalSize = result.files.reduce((sum, file) => sum + file.size, 0)
  const totalSizeFormatted = formatBytes(totalSize)

  return {
    fileCount: result.files.length,
    totalSize,
    totalSizeFormatted,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
