/**
 * Standardized Error Format for NextMavens Platform - Error Converters
 *
 * Convert any error to a standard error response.
 */

import { ErrorCode } from './types'
import { PlatformError } from './platform-error'
import type { ErrorResponse } from './types'

/**
 * Type guard to check if an error is a PlatformError
 */
export function isPlatformError(error: unknown): error is PlatformError {
  return error instanceof PlatformError;
}

/**
 * Convert any error to a standard error response
 * Useful for catch blocks where error type is unknown
 *
 * @param error - Unknown error from catch block
 * @param projectId - Optional project ID context
 * @returns Standard error response
 */
export function toErrorResponse(
  error: unknown,
  projectId?: string
): ErrorResponse {
  if (isPlatformError(error)) {
    return error.toResponse();
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const platformError = new PlatformError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      projectId,
      { originalMessage: error.message }
    );
    return platformError.toResponse();
  }

  // Handle unknown errors
  const platformError = new PlatformError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    projectId,
    { originalError: String(error) }
  );
  return platformError.toResponse();
}

/**
 * Convert any error to a NextResponse for API routes
 * Useful for catch blocks in API route handlers
 *
 * @param error - Unknown error from catch block
 * @param projectId - Optional project ID context
 * @returns NextResponse with standard error format
 */
export function toErrorNextResponse(
  error: unknown,
  projectId?: string
): Response {
  if (isPlatformError(error)) {
    return error.toNextResponse();
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const platformError = new PlatformError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      projectId,
      { originalMessage: error.message }
    );
    return platformError.toNextResponse();
  }

  // Handle unknown errors
  const platformError = new PlatformError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    projectId,
    { originalError: String(error) }
  );
  return platformError.toNextResponse();
}
