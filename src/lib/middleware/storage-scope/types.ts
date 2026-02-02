/**
 * Storage Scope Types
 */

export interface StorageFile {
  path: string
  projectId: string
  storagePath: string
  size?: number
  contentType?: string
  createdAt?: Date
}
