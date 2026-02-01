/**
 * Storage Download Module
 *
 * Handles file downloads from Telegram or Cloudinary storage.
 */

import { downloadFile, fileExists, type StorageBackend } from './client'
import { getStorageFile, updateStorageFileMetadata } from './metadata'

/**
 * Download result
 */
export interface DownloadResult {
  /** Storage path of the downloaded file */
  storagePath: string
  /** File content as Buffer */
  data: Buffer
  /** Content type */
  contentType?: string
  /** File size in bytes */
  fileSize: number
  /** File name */
  fileName: string
  /** Which backend was used */
  backend: StorageBackend
  /** File URL (for direct access) */
  fileUrl?: string
}

/**
 * Download options
 */
export interface DownloadOptions {
  /** Track the download (updates last accessed timestamp) */
  track?: boolean
}

/**
 * Download a file from storage
 *
 * @param storagePath - Full storage path (e.g., "project-123:/uploads/image.png")
 * @param options - Download options
 * @returns Download result
 */
export async function downloadFileFromStorage(
  storagePath: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  // Get file metadata from database
  const fileRecord = await getStorageFile(storagePath)

  if (!fileRecord) {
    throw new Error(`File not found: ${storagePath}`)
  }

  // Download from the appropriate backend
  const { data, contentType, fileName } = await downloadFile(fileRecord.file_id, fileRecord.backend)

  // Update last accessed timestamp if tracking is enabled
  if (options.track) {
    try {
      await updateStorageFileMetadata(storagePath, {
        ...(fileRecord.metadata || {}),
        lastAccessedAt: new Date().toISOString(),
      })
    } catch (error) {
      // Ignore tracking errors
      console.warn('[Storage Download] Failed to update last accessed', { error })
    }
  }

  return {
    storagePath,
    data,
    contentType: contentType || fileRecord.content_type,
    fileSize: data.length,
    fileName: fileName || fileRecord.file_name,
    backend: fileRecord.backend,
    fileUrl: fileRecord.file_url,
  }
}

/**
 * Check if a file exists in storage
 *
 * @param storagePath - Full storage path
 * @returns True if the file exists
 */
export async function fileExistsInStorage(storagePath: string): Promise<boolean> {
  try {
    const fileRecord = await getStorageFile(storagePath)
    if (!fileRecord) {
      return false
    }
    return await fileExists(fileRecord.file_id, fileRecord.backend)
  } catch {
    return false
  }
}

/**
 * Get file metadata without downloading
 *
 * @param storagePath - Full storage path
 * @returns File metadata from database
 */
export async function getFileMetadata(storagePath: string) {
  return getStorageFile(storagePath)
}

/**
 * Get file info from database metadata
 *
 * @param storagePath - Full storage path
 * @returns File record or null
 */
export async function getFileInfo(storagePath: string) {
  return getStorageFile(storagePath)
}

/**
 * Get file URL for direct access
 *
 * Returns the CDN URL for the file without downloading it.
 * Useful for displaying images or videos directly.
 *
 * @param storagePath - Full storage path
 * @returns File URL or null
 */
export async function getFileUrl(storagePath: string): Promise<string | null> {
  const fileRecord = await getStorageFile(storagePath)
  return fileRecord?.file_url || null
}

/**
 * Get multiple files by storage paths
 *
 * @param storagePaths - Array of storage paths
 * @returns Array of file records
 */
export async function getFilesInfo(storagePaths: string[]): Promise<Array<typeof getStorageFile extends (...args: any[]) => Promise<infer T> ? T : never>> {
  const results = await Promise.allSettled(
    storagePaths.map(path => getStorageFile(path))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getStorageFile>>> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)
}
