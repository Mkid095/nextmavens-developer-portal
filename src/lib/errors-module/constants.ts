/**
 * Standardized Error Format for NextMavens Platform - Constants
 *
 * Error metadata mappings for error codes and HTTP status codes.
 */

import { ErrorCode, ErrorMetadata } from './types'

/**
 * Error code metadata mapping
 */
export const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
  [ErrorCode.PROJECT_SUSPENDED]: {
    retryable: false,
    docs: '/docs/errors#PROJECT_SUSPENDED',
  },
  [ErrorCode.PROJECT_ARCHIVED]: {
    retryable: false,
    docs: '/docs/errors#PROJECT_ARCHIVED',
  },
  [ErrorCode.PROJECT_DELETED]: {
    retryable: false,
    docs: '/docs/errors#PROJECT_DELETED',
  },
  [ErrorCode.RATE_LIMITED]: {
    retryable: true,
    docs: '/docs/errors#RATE_LIMITED',
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    retryable: false,
    docs: '/docs/errors#QUOTA_EXCEEDED',
  },
  [ErrorCode.KEY_INVALID]: {
    retryable: false,
    docs: '/docs/errors#KEY_INVALID',
  },
  [ErrorCode.SERVICE_DISABLED]: {
    retryable: false,
    docs: '/docs/errors#SERVICE_DISABLED',
  },
  [ErrorCode.PERMISSION_DENIED]: {
    retryable: false,
    docs: '/docs/errors#PERMISSION_DENIED',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    retryable: false,
    docs: '/docs/errors#VALIDATION_ERROR',
  },
  [ErrorCode.INTERNAL_ERROR]: {
    retryable: true,
    docs: '/docs/errors#INTERNAL_ERROR',
  },
  [ErrorCode.AUTHENTICATION_ERROR]: {
    retryable: false,
    docs: '/docs/errors#AUTHENTICATION_ERROR',
  },
  [ErrorCode.NOT_FOUND]: {
    retryable: false,
    docs: '/docs/errors#NOT_FOUND',
  },
  [ErrorCode.CONFLICT]: {
    retryable: false,
    docs: '/docs/errors#CONFLICT',
  },
  [ErrorCode.QUERY_TIMEOUT]: {
    retryable: false,
    docs: '/docs/errors#QUERY_TIMEOUT',
  },
};

/**
 * HTTP status code mapping for error codes
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.PROJECT_SUSPENDED]: 403,
  [ErrorCode.PROJECT_ARCHIVED]: 403,
  [ErrorCode.PROJECT_DELETED]: 404,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.KEY_INVALID]: 401,
  [ErrorCode.SERVICE_DISABLED]: 403,
  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.QUERY_TIMEOUT]: 408,
};
