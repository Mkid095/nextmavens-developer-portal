/**
 * Force Delete Route - Request Validation
 */

import type { ForceDeleteProjectError } from './types'

/**
 * Validate request parameters for force delete
 */
export function validateRequestParams(
  projectId: string,
  sessionId: string,
  adminId: string
): { valid: boolean; errors?: Array<{ field: string; message: string }> } } {
  const errors: Array<{ field: string; message: string }> = []

  if (!projectId || typeof projectId !== 'string') {
    errors.push({ field: 'projectId', message: 'Project ID is required and must be a string' })
  }

  if (!sessionId || typeof sessionId !== 'string') {
    errors.push({ field: 'sessionId', message: 'Session ID is required and must be a string' })
  }

  if (!adminId || typeof adminId !== 'string') {
    errors.push({ field: 'adminId', message: 'Admin ID is required and must be a string' })
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Create authentication error response
 */
export function createAuthError(reason: string): ForceDeleteProjectError {
  return {
    error: 'Invalid or expired break glass token',
    details: `Reason: ${reason}`,
    code: reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
  }
}

/**
 * Create token required error response
 */
export function createTokenRequiredError(): ForceDeleteProjectError {
  return {
    error: 'Break glass token required',
    details: 'Provide break_glass_token in request body or Authorization header with "Break-Glass <token>"',
    code: 'INVALID_TOKEN',
  }
}
