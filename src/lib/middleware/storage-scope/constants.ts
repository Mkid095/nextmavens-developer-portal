/**
 * Storage Scope Constants
 */

export enum StorageScopeError {
  MISSING_PROJECT_ID = 'MISSING_PROJECT_ID',
  INVALID_PATH_FORMAT = 'INVALID_PATH_FORMAT',
  CROSS_PROJECT_PATH = 'CROSS_PROJECT_PATH',
  PATH_TRAVERSAL_DETECTED = 'PATH_TRAVERSAL_DETECTED',
  INVALID_PATH_CHARACTER = 'INVALID_PATH_CHARACTER',
}

export const MAX_PATH_LENGTH = 500

export const PATH_PATTERN = /^([a-f0-9-]+):(\/.*)$/

export const INVALID_CHARS = ['\0', '..', '<', '>', ':', '|', '?', '*']

export const RESERVED_PATHS = [
  'system',
  'admin',
  'auth',
  'control',
  'internal',
  'global',
  'all',
  '*',
  '.',
  '',
]

export const SYSTEM_PREFIXES = ['system:', 'global:', 'admin:', 'internal:'] as const
