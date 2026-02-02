/**
 * Auth Service API Client - Error Handling
 */

import type { AuthServiceError } from '@/lib/types/auth-user.types'

/**
 * Custom error class for auth service API client errors
 */
export class AuthServiceApiClientError extends Error {
  public readonly code?: string
  public readonly details?: Record<string, unknown>

  constructor(message: string, errorResponse: AuthServiceError) {
    super(message)
    this.name = 'AuthServiceApiClientError'
    this.code = errorResponse.code
    this.details = errorResponse.details
  }
}
