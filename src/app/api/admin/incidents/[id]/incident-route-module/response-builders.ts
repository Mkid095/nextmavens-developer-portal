/**
 * Incident Route Module - Response Builders
 */

import { NextResponse } from 'next/server'
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  HTTP_STATUS,
  LOG_PREFIXES,
} from './constants'
import type { ApiResponse } from './types'

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK
): ReturnType<typeof NextResponse.json> {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  )
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  code: string = ERROR_CODES.INTERNAL_ERROR,
  status: number = HTTP_STATUS.INTERNAL_ERROR,
  details?: string
): ReturnType<typeof NextResponse.json> {
  const response: ApiResponse = {
    success: false,
    error,
    code,
  }

  if (details) {
    response.details = details
  }

  return NextResponse.json(response, { status })
}

/**
 * Handle authentication error
 */
export function handleAuthError(message: string): ReturnType<typeof NextResponse.json> {
  if (message === ERROR_MESSAGES.NO_TOKEN || message === ERROR_MESSAGES.INVALID_TOKEN) {
    return errorResponse(
      ERROR_MESSAGES.NO_TOKEN,
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    )
  }
  return null
}

/**
 * Handle authorization error
 */
export function handleAuthzError(message: string): ReturnType<typeof NextResponse.json> {
  if (message.includes('operator or administrator')) {
    return errorResponse(
      ERROR_MESSAGES.INSUFFICIENT_PRIVILEGES,
      ERROR_CODES.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN
    )
  }
  return null
}

/**
 * Handle unknown error
 */
export function handleUnknownError(
  error: unknown,
  logPrefix: string = LOG_PREFIXES.UPDATE_ERROR
): ReturnType<typeof NextResponse.json> {
  console.error(logPrefix, error)

  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error'

  // Check for auth errors first
  const authErrorResponse = handleAuthError(errorMessage)
  if (authErrorResponse) return authErrorResponse

  // Check for authz errors
  const authzErrorResponse = handleAuthzError(errorMessage)
  if (authzErrorResponse) return authzErrorResponse

  // Default internal error
  return errorResponse(
    ERROR_MESSAGES.FAILED_TO_UPDATE,
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_ERROR,
    errorMessage
  )
}

/**
 * Create not found response
 */
export function notFoundResponse(): ReturnType<typeof NextResponse.json> {
  return errorResponse(
    ERROR_MESSAGES.INCIDENT_NOT_FOUND,
    ERROR_CODES.NOT_FOUND,
    HTTP_STATUS.NOT_FOUND
  )
}
