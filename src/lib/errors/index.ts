/**
 * Standardized Error Format for NextMavens Platform
 *
 * Provides consistent error responses across all services with error codes,
 * messages, documentation links, and retryable flags.
 */

// Error codes
export { ErrorCode } from './codes'

// Types
export type { StandardError, ErrorResponse } from './types'

// Metadata
export { ERROR_METADATA, ERROR_STATUS_CODES } from './metadata'

// Platform error class
export { PlatformError } from './platform-error'

// Factory functions
export { createError } from './factory'

// Type guards
export { isPlatformError } from './guards'

// Conversion utilities
export { toErrorResponse, toErrorNextResponse } from './conversion'

// Convenience functions
export {
  validationError,
  authenticationError,
  permissionDeniedError,
  notFoundError,
  rateLimitError,
  projectSuspendedError,
  serviceDisabledError,
  internalError,
  conflictError,
  quotaExceededError,
  projectArchivedError,
  projectDeletedError,
  queryTimeoutError,
} from './convenience'
