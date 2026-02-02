/**
 * Standardized Error Format for NextMavens Platform - Type Definitions
 *
 * Provides consistent error responses across all services with error codes,
 * messages, documentation links, and retryable flags.
 */

/**
 * Standard error codes used across the platform
 */
export enum ErrorCode {
  PROJECT_SUSPENDED = 'PROJECT_SUSPENDED',
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  KEY_INVALID = 'KEY_INVALID',
  SERVICE_DISABLED = 'SERVICE_DISABLED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
}

/**
 * Error metadata with retryable flag and documentation
 */
export interface ErrorMetadata {
  retryable: boolean;
  docs: string;
}

/**
 * Standard error response shape
 */
export interface StandardError {
  code: ErrorCode;
  message: string;
  docs: string;
  retryable: boolean;
  project_id?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Error response wrapper for API responses
 */
export interface ErrorResponse {
  error: StandardError;
}
