/**
 * Storage Scope Path Operations
 */

import {
  StorageScopeError,
  MAX_PATH_LENGTH,
  PATH_PATTERN,
  INVALID_CHARS,
  RESERVED_PATHS,
  SYSTEM_PREFIXES,
} from './constants'

export interface ParsedStoragePath {
  projectId: string
  storagePath: string
}

export function validateStoragePathFormat(path: string): ParsedStoragePath {
  if (!path || typeof path !== 'string') {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  if (path.length > 600) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  const match = path.match(PATH_PATTERN)
  if (!match) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  const [, projectId, storagePath] = match

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(projectId)) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  if (storagePath.length > MAX_PATH_LENGTH) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  if (storagePath.includes('..') || storagePath.includes('\\')) {
    throw new Error(StorageScopeError.PATH_TRAVERSAL_DETECTED)
  }

  for (const char of INVALID_CHARS) {
    if (storagePath.includes(char)) {
      throw new Error(StorageScopeError.INVALID_PATH_CHARACTER)
    }
  }

  const pathWithoutPrefix = storagePath.substring(1)
  const segments = pathWithoutPrefix.split('/').filter(s => s.length > 0)
  for (const segment of segments) {
    if (RESERVED_PATHS.includes(segment.toLowerCase())) {
      throw new Error(StorageScopeError.INVALID_PATH_CHARACTER)
    }
  }

  return { projectId, storagePath }
}

export function validateStoragePath(path: string, projectId: string): void {
  if (!projectId) {
    throw new Error(StorageScopeError.MISSING_PROJECT_ID)
  }

  const parsed = validateStoragePathFormat(path)

  if (parsed.projectId !== projectId) {
    throw new Error(StorageScopeError.CROSS_PROJECT_PATH)
  }
}

export function buildStoragePath(projectId: string, storagePath: string): string {
  if (!projectId) {
    throw new Error(StorageScopeError.MISSING_PROJECT_ID)
  }

  if (!storagePath || typeof storagePath !== 'string') {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  if (!storagePath.startsWith('/')) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  const validation = validateStoragePathFormat(`${projectId}:${storagePath}`)
  if (validation.projectId !== projectId) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT)
  }

  return `${projectId}:${storagePath}`
}

export function extractProjectIdFromPath(path: string): string | null {
  try {
    const parsed = validateStoragePathFormat(path)
    return parsed.projectId
  } catch {
    return null
  }
}

export function extractStoragePath(path: string): string | null {
  try {
    const parsed = validateStoragePathFormat(path)
    return parsed.storagePath
  } catch {
    return null
  }
}

export function isSystemPath(path: string): boolean {
  return SYSTEM_PREFIXES.some(prefix => path.startsWith(prefix))
}

export function generateExamplePaths(projectId: string): string[] {
  return [
    buildStoragePath(projectId, '/uploads/image.png'),
    buildStoragePath(projectId, '/documents/report.pdf'),
    buildStoragePath(projectId, '/assets/logo.svg'),
    buildStoragePath(projectId, '/backups/database.sql'),
    buildStoragePath(projectId, '/logs/app.log'),
  ]
}
