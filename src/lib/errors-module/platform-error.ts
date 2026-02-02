/**
 * Standardized Error Format for NextMavens Platform - PlatformError Class
 *
 * Standard error class for platform errors.
 */

import { ErrorCode } from './types'
import { ERROR_METADATA, ERROR_STATUS_CODES } from './constants'
import type { StandardError, ErrorResponse } from './types'

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
