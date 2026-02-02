/**
 * Error Response Types
 */

import { ErrorCode } from './codes'

/**
 * Standard error response shape
 */
export interface StandardError {
  code: ErrorCode
  message: string
  docs: string
  retryable: boolean
  project_id?: string
  details?: Record<string, unknown>
  timestamp: string
}

/**
 * Error response wrapper for API responses
 */
export interface ErrorResponse {
  error: StandardError
}
