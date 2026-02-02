/**
 * GraphQL Service Snapshot Client Error Helpers
 * Helper functions for creating standardized errors
 */

import {
  ErrorCode,
  PlatformError,
  validationError,
  internalError,
  createError,
} from '@/lib/errors'
import type { GraphQLOperationResult, ErrorResponse } from './types'

/**
 * Create a GraphQL schema validation error
 * Used when the GraphQL schema is invalid or query validation fails
 * @param message - Error message
 * @param details - Optional error details
 * @returns PlatformError with VALIDATION_ERROR code
 */
export function graphQLSchemaError(
  message: string,
  details?: Record<string, unknown>
): PlatformError {
  return validationError(message, {
    ...details,
    service: 'graphql',
    errorType: 'schema_validation',
  })
}

/**
 * Create a GraphQL execution error
 * Used when query execution fails (not validation/syntax errors)
 * @param message - Error message
 * @param details - Optional error details
 * @returns PlatformError with INTERNAL_ERROR code
 */
export function graphQLExecutionError(
  message: string,
  details?: Record<string, unknown>
): PlatformError {
  return internalError(message, {
    ...details,
    service: 'graphql',
    errorType: 'execution',
  })
}

/**
 * Create a GraphQL introspection error
 * Used when introspection is not allowed
 * @param projectId - Project ID
 * @returns PlatformError with PERMISSION_DENIED code
 */
export function graphQLIntrospectionError(projectId: string): PlatformError {
  return createError(
    ErrorCode.PERMISSION_DENIED,
    'GraphQL introspection is not allowed for this project',
    projectId,
    { service: 'graphql', errorType: 'introspection_disabled' }
  )
}

/**
 * Get a standardized GraphQL error response
 * Converts GraphQL operation result to standard error response format
 * @param result - GraphQL operation result
 * @returns ErrorResponse or undefined if operation is allowed
 */
export function getGraphQLErrorResponse(
  result: GraphQLOperationResult
): ErrorResponse | undefined {
  if (result.allowed) {
    return undefined
  }
  return result.errorResponse
}

/**
 * Check if a GraphQL operation result indicates a schema error
 * @param result - GraphQL operation result
 * @returns true if the error is a schema validation error
 */
export function isGraphQLError(
  result: GraphQLOperationResult
): result is GraphQLOperationResult & { allowed: false; errorResponse: ErrorResponse } {
  return !result.allowed && result.errorResponse !== undefined
}

/**
 * Convert a GraphQL error to a NextResponse
 * Useful for API route handlers
 * @param result - GraphQL operation result
 * @returns NextResponse with standard error format
 */
export function toGraphQLErrorNextResponse(
  result: GraphQLOperationResult
): Response | undefined {
  if (result.allowed) {
    return undefined
  }

  if (result.errorResponse?.error) {
    const { error } = result.errorResponse
    return new Response(JSON.stringify(result.errorResponse), {
      status: getStatusCodeForErrorCode(error.code),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  return undefined
}

/**
 * Get HTTP status code for error code
 * @param code - Error code
 * @returns HTTP status code
 */
function getStatusCodeForErrorCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 400
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.KEY_INVALID:
      return 401
    case ErrorCode.PERMISSION_DENIED:
    case ErrorCode.PROJECT_SUSPENDED:
    case ErrorCode.PROJECT_ARCHIVED:
    case ErrorCode.SERVICE_DISABLED:
      return 403
    case ErrorCode.PROJECT_DELETED:
    case ErrorCode.NOT_FOUND:
      return 404
    case ErrorCode.CONFLICT:
      return 409
    case ErrorCode.QUOTA_EXCEEDED:
    case ErrorCode.RATE_LIMITED:
      return 429
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500
  }
}
