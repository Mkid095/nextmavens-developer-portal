/**
 * Storage Upload Route - Module - Constants
 */

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const ERROR_MESSAGES = {
  STORAGE_DISABLED: 'File storage is temporarily disabled. Downloads are still available. Please try again later.',
  AUTH_REQUIRED: 'Authentication required',
  NO_PROJECT: 'No project found for this user',
  MISSING_FIELDS: 'file_name, file_size, and content_type are required',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size of 100MB',
  INVALID_PATH: 'Invalid storage path',
  CROSS_PROJECT_ACCESS: 'Access to other project files not permitted',
  INVALID_FILE_NAME: 'Invalid file name',
  INVALID_FILE_CONTENT: 'file_content is required',
  INVALID_ENCODING: 'Invalid file_content encoding',
  NO_FILE_PROVIDED: 'No file provided in form data',
  SIZE_MISMATCH: 'File size mismatch',
  UPLOAD_FAILED: 'Failed to upload file',
  LIST_FAILED: 'Failed to list files',
} as const

export const STORAGE_SERVICE_NAME = 'storage' as const
