/**
 * Force Delete Route - Error Handling
 */

import type { ForceDeleteProjectError } from './types'

/**
 * Parse error from Error object
 */
export function parseError(error: unknown): { errorMessage: string; errorResponse?: ForceDeleteProjectError } {
  if (error instanceof Error) {
    try {
      const errorObj = JSON.parse(error.message)
      if (errorObj.error && errorObj.code) {
        return {
          errorMessage: error.message,
          errorResponse: errorObj as ForceDeleteProjectError,
        }
      }
    } catch {
      // Not a JSON error, use generic error handling
    }
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  return { errorMessage }
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, code: string = 'FORCE_DELETE_FAILED'): ForceDeleteProjectError {
  return {
    error: 'Failed to force delete project',
    details: message,
    code,
  }
}

/**
 * Get status code for error response
 */
export function getErrorCode(code?: string): number {
  switch (code) {
    case 'PROJECT_NOT_FOUND':
      return 404
    case 'FORCE_DELETE_FAILED':
      return 500
    default:
      return 500
  }
}
