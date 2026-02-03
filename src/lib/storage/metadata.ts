/**
 * Storage File Metadata
 *
 * Database operations for tracking uploaded files.
 * Stores file metadata in the control_plane.storage_files table.
 *
 * Migration required: 028_create_storage_files_table.sql
 */

export type { StorageFile, StorageStats } from './metadata/types'
export {
  createStorageFile,
  getStorageFile,
  getStorageFileById,
  updateStorageFileMetadata,
  deleteStorageFile,
  deleteProjectFiles,
} from './metadata/crud'
export {
  listStorageFiles,
  listStorageFilesByPath,
  listStorageFilesByBackend,
} from './metadata/queries'
export {
  getStorageUsage,
  getStorageUsageByBackend,
  getStorageFileCount,
  getStorageStats,
} from './metadata/stats'
