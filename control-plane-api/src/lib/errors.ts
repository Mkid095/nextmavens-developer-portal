/**
 * Standardized Error Format for NextMavens Platform - Control Plane API
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
}

/**
 * Error metadata with retryable flag and documentation
 */
export interface ErrorMetadata {
  retryable: boolean;
  docs: string;
}

/**
 * Error code metadata mapping
 */
const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
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
};

/**
 * HTTP status code mapping for error codes
 */
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
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
};

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

/**
 * Standard error class for platform errors
 */
export class PlatformError extends Error {
  public readonly code: ErrorCode;
  public readonly retryable: boolean;
  public readonly docs: string;
  public readonly statusCode: number;
  public readonly projectId?: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    projectId?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PlatformError';
    this.code = code;
    this.message = message;
    this.projectId = projectId;
    this.details = details;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.retryable = ERROR_METADATA[code].retryable;
    this.docs = ERROR_METADATA[code].docs;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Convert to standard error response format
   */
  toResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        docs: this.docs,
        retryable: this.retryable,
        project_id: this.projectId,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Convert to NextResponse for API routes
   */
  toNextResponse(): Response {
    return new Response(JSON.stringify(this.toResponse()), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...(this.code === ErrorCode.RATE_LIMITED && {
          'Retry-After': this.details?.retry_after?.toString() || '60',
        }),
      },
    });
  }
}

/**
 * Error factory function to create consistent errors
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
 * Type guard to check if an error is a PlatformError
 */
export function isPlatformError(error: unknown): error is PlatformError {
  return error instanceof PlatformError;
}

/**
 * Convert any error to a NextResponse for API routes
 * Useful for catch blocks in API route handlers
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
    const platformError = createError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      projectId,
      { originalMessage: error.message }
    );
    return platformError.toNextResponse();
  }

  // Handle unknown errors
  const platformError = createError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    projectId,
    { originalError: String(error) }
  );
  return platformError.toNextResponse();
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
