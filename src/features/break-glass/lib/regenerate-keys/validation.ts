/**
 * Regenerate Keys Validation
 */

import type { RegenerateKeysParams, ValidationResult, ValidationError } from './types'

/**
 * Validate regenerate keys request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 */
export function validateRegenerateKeysRequest(
  params: Partial<RegenerateKeysParams>
): ValidationResult {
  const errors: ValidationError[] = []

  if (!params.projectId || typeof params.projectId !== 'string') {
    errors.push({
      field: 'projectId',
      message: 'Project ID is required and must be a string',
    })
  }

  if (!params.sessionId || typeof params.sessionId !== 'string') {
    errors.push({
      field: 'sessionId',
      message: 'Session ID is required and must be a string',
    })
  }

  if (!params.adminId || typeof params.adminId !== 'string') {
    errors.push({
      field: 'adminId',
      message: 'Admin ID is required and must be a string',
    })
  }

  if (params.keyCount !== undefined) {
    if (
      typeof params.keyCount !== 'number' ||
      params.keyCount < 1 ||
      params.keyCount > 10
    ) {
      errors.push({
        field: 'keyCount',
        message: 'Key count must be a number between 1 and 10',
      })
    }
  }

  if (params.environment !== undefined) {
    const validEnvironments = ['live', 'test', 'dev']
    if (!validEnvironments.includes(params.environment)) {
      errors.push({
        field: 'environment',
        message: `Environment must be one of: ${validEnvironments.join(', ')}`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
