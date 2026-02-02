/**
 * Storage Path Scoping Middleware
 *
 * Middleware for scoping storage paths to project-specific prefixes.
 * Enforces project isolation by ensuring file paths follow the pattern: project_id:/path
 *
 * US-004: Prefix Storage Paths
 */

export {
  StorageScopeError,
  MAX_PATH_LENGTH,
  PATH_PATTERN,
  INVALID_CHARS,
  RESERVED_PATHS,
  SYSTEM_PREFIXES,
} from './storage-scope/constants'

export {
  validateStoragePathFormat,
  validateStoragePath,
  buildStoragePath,
  extractProjectIdFromPath,
  extractStoragePath,
  isSystemPath,
  generateExamplePaths,
  type ParsedStoragePath,
} from './storage-scope/path'

export { handleFileUpload, handleFileDownload } from './storage-scope/handlers'

export { createStorageFile } from './storage-scope/utils'

export type { StorageFile } from './storage-scope/types'

export { default } from './storage-scope/handlers'
