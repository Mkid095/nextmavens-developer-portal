/**
 * Storage Scope Utilities
 */

import { buildStoragePath } from './path'
import type { StorageFile } from './types'

export function createStorageFile(
  projectId: string,
  storagePath: string,
  metadata?: { size?: number; contentType?: string }
): StorageFile {
  const fullPath = buildStoragePath(projectId, storagePath)

  return {
    path: fullPath,
    projectId,
    storagePath,
    size: metadata?.size,
    contentType: metadata?.contentType,
    createdAt: new Date(),
  }
}
