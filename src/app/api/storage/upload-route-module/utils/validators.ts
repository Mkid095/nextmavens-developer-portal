/**
 * Storage Upload Route - Module - Utility: Validators
 */

import type { ValidationResult, UploadRequestBody } from '../types'
import { MAX_FILE_SIZE, ERROR_MESSAGES } from '../constants'

export function validateRequiredFields(body: UploadRequestBody): ValidationResult {
  const { file_name, file_size, content_type } = body

  if (!file_name || file_size === undefined || !content_type) {
    const missingFields: string[] = []
    if (!file_name) missingFields.push('file_name')
    if (file_size === undefined) missingFields.push('file_size')
    if (!content_type) missingFields.push('content_type')

    return {
      valid: false,
      error: ERROR_MESSAGES.MISSING_FIELDS,
      details: { missing_fields: missingFields },
    }
  }

  return { valid: true }
}

export function validateFileSize(file_size: number): ValidationResult {
  if (file_size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE,
      details: {
        max_size: MAX_FILE_SIZE,
        requested_size: file_size,
      },
    }
  }

  return { valid: true }
}
