/**
 * Control Plane API Base Client
 * Core client with request handling logic
 */

import type {
  ControlPlaneConfig,
  ControlPlaneError,
  RequestHeaders,
} from './types'

/**
 * Custom error class for Control Plane API client errors
 */
export class ControlPlaneApiClientError extends Error {
  public readonly code?: string
  public readonly details?: Record<string, unknown>

  constructor(message: string, errorResponse: ControlPlaneError) {
    super(message)
    this.name = 'ControlPlaneApiClientError'
    this.code = errorResponse.code
    this.details = errorResponse.details
  }
}

/**
 * Base Control Plane API client
 * Provides core request functionality
 */
export class BaseControlPlaneClient {
  protected config: ControlPlaneConfig

  constructor(config: ControlPlaneConfig) {
    this.config = config
  }

  /**
   * Get the authorization token from the request headers
   * This allows the client to forward the user's JWT to the Control Plane API
   */
  protected getAuthHeaders(req?: RequestHeaders): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (req?.headers) {
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        headers['Authorization'] = authHeader
      }
    }

    return headers
  }

  /**
   * Make an authenticated request to the Control Plane API
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    req?: RequestHeaders
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      ...this.getAuthHeaders(req),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error: ControlPlaneError = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }))
        throw new ControlPlaneApiClientError(error.message || error.error, error)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ControlPlaneApiClientError) {
        throw error
      }
      throw new ControlPlaneApiClientError(
        'Failed to connect to Control Plane API',
        {
          error: 'NetworkError',
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      )
    }
  }
}
