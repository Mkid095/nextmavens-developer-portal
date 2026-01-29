/**
 * Auth Service API Client
 * Client for interacting with the auth service for user management
 */

import type {
  EndUser,
  EndUserListQuery,
  EndUserListResponse,
  EndUserDetailResponse,
  DisableEndUserRequest,
  EnableEndUserRequest,
  EndUserStatusResponse,
  UpdateEndUserMetadataRequest,
  DeleteEndUserRequest,
  DeleteEndUserResponse,
  ResetEndUserPasswordRequest,
  ResetEndUserPasswordResponse,
  EndUserSession,
  EndUserSessionsResponse,
  RevokeEndUserSessionRequest,
  RevokeEndUserSessionResponse,
  EndUserAuthHistory,
  AuthHistoryListQuery,
  AuthHistoryListResponse,
  AuthServiceError,
} from '@/lib/types/auth-user.types'

/**
 * Auth service configuration
 */
interface AuthServiceConfig {
  baseUrl: string
  apiKey: string
}

/**
 * Auth service API client
 */
export class AuthServiceClient {
  private config: AuthServiceConfig

  constructor(config: AuthServiceConfig) {
    this.config = config
  }

  /**
   * Make an authenticated request to the auth service
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error: AuthServiceError = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }))
        throw new AuthServiceApiClientError(error.message, error)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof AuthServiceApiClientError) {
        throw error
      }
      throw new AuthServiceApiClientError(
        'Failed to connect to auth service',
        {
          error: 'NetworkError',
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      )
    }
  }

  /**
   * List all end-users with optional filtering
   */
  async listEndUsers(query: EndUserListQuery = {}): Promise<EndUserListResponse> {
    const params = new URLSearchParams()

    if (query.limit) params.append('limit', String(query.limit))
    if (query.offset) params.append('offset', String(query.offset))
    if (query.search) params.append('search', query.search)
    if (query.status) params.append('status', query.status)
    if (query.auth_provider) params.append('auth_provider', query.auth_provider)
    if (query.created_after) params.append('created_after', query.created_after)
    if (query.created_before) params.append('created_before', query.created_before)
    if (query.last_sign_in_after) params.append('last_sign_in_after', query.last_sign_in_after)
    if (query.last_sign_in_before) params.append('last_sign_in_before', query.last_sign_in_before)
    if (query.sort_by) params.append('sort_by', query.sort_by)
    if (query.sort_order) params.append('sort_order', query.sort_order)

    const queryString = params.toString()
    return this.request<EndUserListResponse>(`/users${queryString ? `?${queryString}` : ''}`)
  }

  /**
   * Get a single end-user by ID
   */
  async getEndUser(userId: string): Promise<EndUserDetailResponse> {
    return this.request<EndUserDetailResponse>(`/users/${userId}`)
  }

  /**
   * Disable an end-user account
   */
  async disableEndUser(request: DisableEndUserRequest): Promise<EndUserStatusResponse> {
    return this.request<EndUserStatusResponse>(`/users/${request.userId}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason: request.reason }),
    })
  }

  /**
   * Enable (re-enable) an end-user account
   */
  async enableEndUser(request: EnableEndUserRequest): Promise<EndUserStatusResponse> {
    return this.request<EndUserStatusResponse>(`/users/${request.userId}/enable`, {
      method: 'POST',
    })
  }

  /**
   * Update end-user metadata
   */
  async updateEndUserMetadata(request: UpdateEndUserMetadataRequest): Promise<EndUserDetailResponse> {
    return this.request<EndUserDetailResponse>(`/users/${request.userId}/metadata`, {
      method: 'PATCH',
      body: JSON.stringify({ metadata: request.metadata }),
    })
  }

  /**
   * Delete an end-user account
   */
  async deleteEndUser(request: DeleteEndUserRequest): Promise<DeleteEndUserResponse> {
    return this.request<DeleteEndUserResponse>(`/users/${request.userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason: request.reason }),
    })
  }

  /**
   * Reset end-user password (sends reset email)
   */
  async resetEndUserPassword(request: ResetEndUserPasswordRequest): Promise<ResetEndUserPasswordResponse> {
    return this.request<ResetEndUserPasswordResponse>(`/users/${request.userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ email: request.email }),
    })
  }

  /**
   * Get all sessions for an end-user
   */
  async getEndUserSessions(userId: string): Promise<EndUserSessionsResponse> {
    return this.request<EndUserSessionsResponse>(`/users/${userId}/sessions`)
  }

  /**
   * Revoke a specific session for an end-user
   */
  async revokeEndUserSession(request: RevokeEndUserSessionRequest): Promise<RevokeEndUserSessionResponse> {
    return this.request<RevokeEndUserSessionResponse>(`/users/${request.userId}/sessions/${request.sessionId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get authentication history for an end-user
   */
  async getEndUserAuthHistory(userId: string, query: AuthHistoryListQuery = {}): Promise<AuthHistoryListResponse> {
    const params = new URLSearchParams()

    if (query.limit) params.append('limit', String(query.limit))
    if (query.offset) params.append('offset', String(query.offset))

    const queryString = params.toString()
    return this.request<AuthHistoryListResponse>(`/users/${userId}/auth-history${queryString ? `?${queryString}` : ''}`)
  }

  // Legacy aliases for backward compatibility
  /**
   * @deprecated Use listEndUsers instead
   */
  async listUsers(query: EndUserListQuery = {}): Promise<EndUserListResponse> {
    return this.listEndUsers(query)
  }

  /**
   * @deprecated Use getEndUser instead
   */
  async getUser(userId: string): Promise<EndUserDetailResponse> {
    return this.getEndUser(userId)
  }

  /**
   * @deprecated Use disableEndUser instead
   */
  async disableUser(request: DisableEndUserRequest): Promise<EndUserStatusResponse> {
    return this.disableEndUser(request)
  }

  /**
   * @deprecated Use enableEndUser instead
   */
  async enableUser(request: EnableEndUserRequest): Promise<EndUserStatusResponse> {
    return this.enableEndUser(request)
  }

  /**
   * @deprecated Use updateEndUserMetadata instead
   */
  async updateUserMetadata(request: UpdateEndUserMetadataRequest): Promise<EndUserDetailResponse> {
    return this.updateEndUserMetadata(request)
  }

  /**
   * @deprecated Use deleteEndUser instead
   */
  async deleteUser(request: DeleteEndUserRequest): Promise<DeleteEndUserResponse> {
    return this.deleteEndUser(request)
  }

  /**
   * @deprecated Use resetEndUserPassword instead
   */
  async resetPassword(request: ResetEndUserPasswordRequest): Promise<ResetEndUserPasswordResponse> {
    return this.resetEndUserPassword(request)
  }

  /**
   * @deprecated Use getEndUserSessions instead
   */
  async getUserSessions(userId: string): Promise<EndUserSessionsResponse> {
    return this.getEndUserSessions(userId)
  }

  /**
   * @deprecated Use revokeEndUserSession instead
   */
  async revokeSession(request: RevokeEndUserSessionRequest): Promise<RevokeEndUserSessionResponse> {
    return this.revokeEndUserSession(request)
  }

  /**
   * @deprecated Use getEndUserAuthHistory instead
   */
  async getAuthHistory(userId: string, query: AuthHistoryListQuery = {}): Promise<AuthHistoryListResponse> {
    return this.getEndUserAuthHistory(userId, query)
  }
}

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

/**
 * Create a singleton auth service client instance
 * Reads configuration from environment variables
 */
export function createAuthServiceClient(): AuthServiceClient {
  const baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
  const apiKey = process.env.AUTH_SERVICE_API_KEY || ''

  if (!apiKey) {
    throw new Error('AUTH_SERVICE_API_KEY environment variable is required')
  }

  return new AuthServiceClient({ baseUrl, apiKey })
}

/**
 * Get or create the default auth service client instance
 * Throws if AUTH_SERVICE_API_KEY is not set
 * Use this when you need the client and want to fail fast if it's not configured
 */
export function requireAuthServiceClient(): AuthServiceClient {
  if (!authServiceClient) {
    throw new Error('AUTH_SERVICE_API_KEY environment variable is required')
  }
  return authServiceClient
}

/**
 * Get or create the default auth service client instance
 * Returns undefined if AUTH_SERVICE_API_KEY is not set
 */
export function getAuthServiceClient(): AuthServiceClient | undefined {
  return authServiceClient
}

/**
 * Default auth service client instance (lazy, may be undefined)
 * Use requireAuthServiceClient() to safely access when required
 * Use getAuthServiceClient() to safely access when optional
 */
export let authServiceClient: AuthServiceClient | undefined = undefined

try {
  authServiceClient = createAuthServiceClient()
} catch {
  // AUTH_SERVICE_API_KEY not set, client will be undefined
}
