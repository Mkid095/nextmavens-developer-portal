/**
 * Auth Service API Client - Client Class
 *
 * Client for interacting with the auth service for user management.
 */

import type { AuthServiceConfig } from './types'
import type {
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
  EndUserSessionsResponse,
  RevokeEndUserSessionRequest,
  RevokeEndUserSessionResponse,
  AuthHistoryListQuery,
  AuthHistoryListResponse,
  AuthServiceError,
} from '@/lib/types/auth-user.types'
import { AuthServiceApiClientError } from './error'

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
   *
   * @param endpoint - The API endpoint path
   * @param options - Request options (method, body, etc.)
   * @param customHeaders - Optional additional headers to merge with defaults (e.g., correlation ID)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customHeaders?: HeadersInit
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...customHeaders,
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
   *
   * @param query - Query parameters for filtering and pagination
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async listEndUsers(query: EndUserListQuery = {}, headers?: HeadersInit): Promise<EndUserListResponse> {
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
    return this.request<EndUserListResponse>(`/users${queryString ? `?${queryString}` : ''}`, {}, headers)
  }

  /**
   * Get a single end-user by ID
   *
   * @param userId - The user ID to fetch
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async getEndUser(userId: string, headers?: HeadersInit): Promise<EndUserDetailResponse> {
    return this.request<EndUserDetailResponse>(`/users/${userId}`, {}, headers)
  }

  /**
   * Disable an end-user account
   *
   * @param request - Disable request with user ID and reason
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async disableEndUser(request: DisableEndUserRequest, headers?: HeadersInit): Promise<EndUserStatusResponse> {
    return this.request<EndUserStatusResponse>(`/users/${request.userId}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason: request.reason }),
    }, headers)
  }

  /**
   * Enable (re-enable) an end-user account
   *
   * @param request - Enable request with user ID
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async enableEndUser(request: EnableEndUserRequest, headers?: HeadersInit): Promise<EndUserStatusResponse> {
    return this.request<EndUserStatusResponse>(`/users/${request.userId}/enable`, {
      method: 'POST',
    }, headers)
  }

  /**
   * Update end-user metadata
   *
   * @param request - Update request with user ID and metadata
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async updateEndUserMetadata(request: UpdateEndUserMetadataRequest, headers?: HeadersInit): Promise<EndUserDetailResponse> {
    return this.request<EndUserDetailResponse>(`/users/${request.userId}/metadata`, {
      method: 'PATCH',
      body: JSON.stringify({ metadata: request.metadata }),
    }, headers)
  }

  /**
   * Delete an end-user account
   *
   * @param request - Delete request with user ID and reason
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async deleteEndUser(request: DeleteEndUserRequest, headers?: HeadersInit): Promise<DeleteEndUserResponse> {
    return this.request<DeleteEndUserResponse>(`/users/${request.userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason: request.reason }),
    }, headers)
  }

  /**
   * Reset end-user password (sends reset email)
   *
   * @param request - Reset password request with user ID and email
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async resetEndUserPassword(request: ResetEndUserPasswordRequest, headers?: HeadersInit): Promise<ResetEndUserPasswordResponse> {
    return this.request<ResetEndUserPasswordResponse>(`/users/${request.userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ email: request.email }),
    }, headers)
  }

  /**
   * Get all sessions for an end-user
   *
   * @param userId - The user ID to fetch sessions for
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async getEndUserSessions(userId: string, headers?: HeadersInit): Promise<EndUserSessionsResponse> {
    return this.request<EndUserSessionsResponse>(`/users/${userId}/sessions`, {}, headers)
  }

  /**
   * Revoke a specific session for an end-user
   *
   * @param request - Revoke request with user ID and session ID
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async revokeEndUserSession(request: RevokeEndUserSessionRequest, headers?: HeadersInit): Promise<RevokeEndUserSessionResponse> {
    return this.request<RevokeEndUserSessionResponse>(`/users/${request.userId}/sessions/${request.sessionId}`, {
      method: 'DELETE',
    }, headers)
  }

  /**
   * Get authentication history for an end-user
   *
   * @param userId - The user ID to fetch auth history for
   * @param query - Optional query parameters for pagination
   * @param headers - Optional additional headers (e.g., correlation ID for tracing)
   */
  async getEndUserAuthHistory(userId: string, query: AuthHistoryListQuery = {}, headers?: HeadersInit): Promise<AuthHistoryListResponse> {
    const params = new URLSearchParams()

    if (query.limit) params.append('limit', String(query.limit))
    if (query.offset) params.append('offset', String(query.offset))

    const queryString = params.toString()
    return this.request<AuthHistoryListResponse>(`/users/${userId}/auth-history${queryString ? `?${queryString}` : ''}`, {}, headers)
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
