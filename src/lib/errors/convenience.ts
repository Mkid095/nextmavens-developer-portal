/**
 * Convenience Error Functions
 *
 * Pre-configured error creators for common error scenarios
 */

import { ErrorCode } from './codes'
import { createError } from './factory'

export function validationError(
  message: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.VALIDATION_ERROR, message, undefined, details)
}

export function authenticationError(
  message: string = 'Authentication required'
): PlatformError {
  return createError(ErrorCode.AUTHENTICATION_ERROR, message)
}

export function permissionDeniedError(
  message: string = 'Permission denied',
  projectId?: string
): PlatformError {
  return createError(ErrorCode.PERMISSION_DENIED, message, projectId)
}

export function notFoundError(
  message: string = 'Resource not found',
  projectId?: string
): PlatformError {
  return createError(ErrorCode.NOT_FOUND, message, projectId)
}

export function rateLimitError(
  message: string = 'Rate limit exceeded',
  retryAfter?: number
): PlatformError {
  return createError(
    ErrorCode.RATE_LIMITED,
    message,
    undefined,
    retryAfter ? { retry_after: retryAfter } : undefined
  )
}

export function projectSuspendedError(
  message: string = 'Project is suspended',
  projectId: string
): PlatformError {
  return createError(ErrorCode.PROJECT_SUSPENDED, message, projectId)
}

export function serviceDisabledError(
  message: string,
  service: string,
  projectId?: string
): PlatformError {
  return createError(
    ErrorCode.SERVICE_DISABLED,
    message,
    projectId,
    { service }
  )
}

export function internalError(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.INTERNAL_ERROR, message, undefined, details)
}

export function conflictError(
  message: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.CONFLICT, message, undefined, details)
}

export function quotaExceededError(
  message: string = 'Quota exceeded',
  projectId?: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.QUOTA_EXCEEDED, message, projectId, details)
}

export function projectArchivedError(
  message: string = 'Project is archived',
  projectId: string
): PlatformError {
  return createError(ErrorCode.PROJECT_ARCHIVED, message, projectId)
}

export function projectDeletedError(
  message: string = 'Project has been deleted',
  projectId: string
): PlatformError {
  return createError(ErrorCode.PROJECT_DELETED, message, projectId)
}

export function queryTimeoutError(
  message: string = 'Query execution timeout',
  projectId?: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.QUERY_TIMEOUT, message, projectId, details)
}
