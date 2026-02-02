/**
 * Standardized Error Format for NextMavens Platform - Error Factories
 *
 * Convenience functions for creating common errors.
 */

import { ErrorCode } from './types'
import { PlatformError } from './platform-error'

/**
 * Error factory function to create consistent errors
 *
 * @param code - Error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param projectId - Optional project ID for scoping
 * @param details - Additional error details
 * @returns PlatformError instance
 *
 * @example
 * ```ts
 * const error = createError(
 *   ErrorCode.VALIDATION_ERROR,
 *   'Email is required',
 *   undefined,
 *   { field: 'email' }
 * );
 * throw error;
 * ```
 */
export function createError(
  code: ErrorCode,
  message: string,
  projectId?: string,
  details?: Record<string, unknown>
): PlatformError {
  return new PlatformError(code, message, projectId, details);
}

/**
 * Convenience functions for common errors
 */

export function validationError(
  message: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.VALIDATION_ERROR, message, undefined, details);
}

export function authenticationError(
  message: string = 'Authentication required'
): PlatformError {
  return createError(ErrorCode.AUTHENTICATION_ERROR, message);
}

export function permissionDeniedError(
  message: string = 'Permission denied',
  projectId?: string
): PlatformError {
  return createError(ErrorCode.PERMISSION_DENIED, message, projectId);
}

export function notFoundError(
  message: string = 'Resource not found',
  projectId?: string
): PlatformError {
  return createError(ErrorCode.NOT_FOUND, message, projectId);
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
  );
}

export function projectSuspendedError(
  message: string = 'Project is suspended',
  projectId: string
): PlatformError {
  return createError(ErrorCode.PROJECT_SUSPENDED, message, projectId);
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
  );
}

export function internalError(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.INTERNAL_ERROR, message, undefined, details);
}

export function conflictError(
  message: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.CONFLICT, message, undefined, details);
}

export function quotaExceededError(
  message: string = 'Quota exceeded',
  projectId?: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.QUOTA_EXCEEDED, message, projectId, details);
}

export function projectArchivedError(
  message: string = 'Project is archived',
  projectId: string
): PlatformError {
  return createError(ErrorCode.PROJECT_ARCHIVED, message, projectId);
}

export function projectDeletedError(
  message: string = 'Project has been deleted',
  projectId: string
): PlatformError {
  return createError(ErrorCode.PROJECT_DELETED, message, projectId);
}

export function queryTimeoutError(
  message: string = 'Query execution timeout',
  projectId?: string,
  details?: Record<string, unknown>
): PlatformError {
  return createError(ErrorCode.QUERY_TIMEOUT, message, projectId, details);
}
