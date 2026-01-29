/**
 * Studio Error Handling Utilities
 * Centralized error handling for Studio API operations
 */

import type { AuthServiceError } from '@/lib/types/auth-user.types'
import { StudioAuthError } from './auth-service-client'

/**
 * Error types for Studio operations
 */
export enum StudioErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Studio error result interface
 */
export interface StudioErrorResult {
  code: StudioErrorCode
  message: string
  details?: Record<string, unknown>
  originalError?: Error
}

/**
 * Parse auth service error and convert to Studio error
 */
export function parseAuthServiceError(error: AuthServiceError): StudioErrorResult {
  const errorCode = error.code?.toUpperCase()

  switch (errorCode) {
    case 'NETWORK_ERROR':
    case 'CONNECTION_ERROR':
      return {
        code: StudioErrorCode.NETWORK_ERROR,
        message: 'Unable to connect to auth service. Please check your connection.',
        details: error.details,
      }

    case 'AUTHENTICATION_ERROR':
    case 'INVALID_TOKEN':
    case 'UNAUTHORIZED':
      return {
        code: StudioErrorCode.AUTHENTICATION_ERROR,
        message: 'Authentication failed. Please sign in again.',
        details: error.details,
      }

    case 'AUTHORIZATION_ERROR':
    case 'FORBIDDEN':
      return {
        code: StudioErrorCode.AUTHORIZATION_ERROR,
        message: 'You do not have permission to perform this action.',
        details: error.details,
      }

    case 'VALIDATION_ERROR':
    case 'INVALID_INPUT':
      return {
        code: StudioErrorCode.VALIDATION_ERROR,
        message: error.message || 'Invalid input provided',
        details: error.details,
      }

    case 'NOT_FOUND':
    case 'USER_NOT_FOUND':
      return {
        code: StudioErrorCode.NOT_FOUND_ERROR,
        message: 'The requested resource was not found.',
        details: error.details,
      }

    case 'CONFLICT':
    case 'USER_ALREADY_EXISTS':
      return {
        code: StudioErrorCode.CONFLICT_ERROR,
        message: 'A conflict occurred. The resource may already exist.',
        details: error.details,
      }

    case 'RATE_LIMIT_EXCEEDED':
      return {
        code: StudioErrorCode.RATE_LIMIT_ERROR,
        message: 'Too many requests. Please try again later.',
        details: error.details,
      }

    default:
      return {
        code: StudioErrorCode.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred',
        details: error.details,
      }
  }
}

/**
 * Parse any error and convert to Studio error
 */
export function parseError(error: unknown): StudioErrorResult {
  if (error instanceof StudioAuthError) {
    return {
      code: StudioErrorCode.AUTHENTICATION_ERROR,
      message: error.message,
      originalError: error,
    }
  }

  // Check if it's an auth service error
  const authError = error as AuthServiceError
  if (authError.error && authError.message) {
    return parseAuthServiceError(authError)
  }

  // Check if it's a standard Error
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        code: StudioErrorCode.NETWORK_ERROR,
        message: 'Network error occurred. Please check your connection.',
        originalError: error,
      }
    }

    return {
      code: StudioErrorCode.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      originalError: error,
    }
  }

  return {
    code: StudioErrorCode.UNKNOWN_ERROR,
    message: 'An unexpected error occurred',
    originalError: error as Error,
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: StudioErrorResult): string {
  return error.message
}

/**
 * Get error title for display
 */
export function getErrorTitle(error: StudioErrorResult): string {
  switch (error.code) {
    case StudioErrorCode.NETWORK_ERROR:
      return 'Connection Error'
    case StudioErrorCode.AUTHENTICATION_ERROR:
      return 'Authentication Failed'
    case StudioErrorCode.AUTHORIZATION_ERROR:
      return 'Permission Denied'
    case StudioErrorCode.VALIDATION_ERROR:
      return 'Invalid Input'
    case StudioErrorCode.NOT_FOUND_ERROR:
      return 'Not Found'
    case StudioErrorCode.CONFLICT_ERROR:
      return 'Conflict'
    case StudioErrorCode.RATE_LIMIT_ERROR:
      return 'Rate Limit Exceeded'
    case StudioErrorCode.SERVER_ERROR:
      return 'Server Error'
    default:
      return 'Error'
  }
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: StudioErrorResult): boolean {
  return [
    StudioErrorCode.NETWORK_ERROR,
    StudioErrorCode.RATE_LIMIT_ERROR,
    StudioErrorCode.SERVER_ERROR,
  ].includes(error.code)
}

/**
 * Check if error requires re-authentication
 */
export function requiresReauth(error: StudioErrorResult): boolean {
  return error.code === StudioErrorCode.AUTHENTICATION_ERROR
}

/**
 * Log error for debugging
 */
export function logError(error: StudioErrorResult, context?: string): void {
  const logData = {
    code: error.code,
    message: error.message,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error('[Studio Error]', logData)

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service (e.g., Sentry)
  }
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: StudioErrorResult }> {
  try {
    const data = await operation()
    return { data }
  } catch (error) {
    const studioError = parseError(error)
    logError(studioError, context)
    return { error: studioError }
  }
}

/**
 * Wrap an async function with error handling that throws
 */
export async function withErrorHandlingThrow<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const studioError = parseError(error)
    logError(studioError, context)
    throw new StudioError(studioError.message, studioError)
  }
}

/**
 * Custom error class for Studio operations
 */
export class StudioError extends Error {
  public readonly code: StudioErrorCode
  public readonly details?: Record<string, unknown>

  constructor(message: string, errorResult: StudioErrorResult) {
    super(message)
    this.name = 'StudioError'
    this.code = errorResult.code
    this.details = errorResult.details
  }
}
