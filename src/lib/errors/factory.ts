/**
 * Error Factory Functions
 */

import { ErrorCode } from './codes'
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
  return new PlatformError(code, message, projectId, details)
}
