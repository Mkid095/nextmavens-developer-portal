/**
 * Studio Auth Service Client
 * Studio-specific wrapper for the auth service API client
 * Uses developer portal token for authentication
 */

import { AuthServiceClient, AuthServiceApiClientError } from '@/lib/api/auth-service-client'
import { authenticateRequest, type Developer } from '@/lib/auth'
import { NextRequest } from 'next/server'

/**
 * Studio auth service client configuration
 */
interface StudioAuthServiceConfig {
  baseUrl: string
  getToken: () => Promise<string>
}

/**
 * Studio-specific auth service API client
 * Wraps the base auth service client with developer portal authentication
 */
export class StudioAuthServiceClient {
  private config: StudioAuthServiceConfig
  private client: AuthServiceClient | null = null

  constructor(config: StudioAuthServiceConfig) {
    this.config = config
  }

  /**
   * Get or create the authenticated auth service client
   */
  private async getClient(): Promise<AuthServiceClient> {
    if (!this.client) {
      const token = await this.config.getToken()
      this.client = new AuthServiceClient({
        baseUrl: this.config.baseUrl,
        apiKey: token,
      })
    }
    return this.client
  }

  /**
   * List all end-users with optional filtering
   */
  async listEndUsers(query: Parameters<AuthServiceClient['listEndUsers']>[0] = {}) {
    const client = await this.getClient()
    return client.listEndUsers(query)
  }

  /**
   * Get a single end-user by ID
   */
  async getEndUser(userId: string) {
    const client = await this.getClient()
    return client.getEndUser(userId)
  }

  /**
   * Disable an end-user account
   */
  async disableEndUser(request: Parameters<AuthServiceClient['disableEndUser']>[0]) {
    const client = await this.getClient()
    return client.disableEndUser(request)
  }

  /**
   * Enable (re-enable) an end-user account
   */
  async enableEndUser(request: Parameters<AuthServiceClient['enableEndUser']>[0]) {
    const client = await this.getClient()
    return client.enableEndUser(request)
  }

  /**
   * Update end-user metadata
   */
  async updateEndUserMetadata(request: Parameters<AuthServiceClient['updateEndUserMetadata']>[0]) {
    const client = await this.getClient()
    return client.updateEndUserMetadata(request)
  }

  /**
   * Delete an end-user account
   */
  async deleteEndUser(request: Parameters<AuthServiceClient['deleteEndUser']>[0]) {
    const client = await this.getClient()
    return client.deleteEndUser(request)
  }

  /**
   * Reset end-user password (sends reset email)
   */
  async resetEndUserPassword(request: Parameters<AuthServiceClient['resetEndUserPassword']>[0]) {
    const client = await this.getClient()
    return client.resetEndUserPassword(request)
  }

  /**
   * Get all sessions for an end-user
   */
  async getEndUserSessions(userId: string) {
    const client = await this.getClient()
    return client.getEndUserSessions(userId)
  }

  /**
   * Revoke a specific session for an end-user
   */
  async revokeEndUserSession(request: Parameters<AuthServiceClient['revokeEndUserSession']>[0]) {
    const client = await this.getClient()
    return client.revokeEndUserSession(request)
  }

  // Legacy aliases for backward compatibility
  /**
   * @deprecated Use listEndUsers instead
   */
  async listUsers(query: Parameters<AuthServiceClient['listEndUsers']>[0] = {}) {
    return this.listEndUsers(query)
  }

  /**
   * @deprecated Use getEndUser instead
   */
  async getUser(userId: string) {
    return this.getEndUser(userId)
  }

  /**
   * @deprecated Use disableEndUser instead
   */
  async disableUser(request: Parameters<AuthServiceClient['disableEndUser']>[0]) {
    return this.disableEndUser(request)
  }

  /**
   * @deprecated Use enableEndUser instead
   */
  async enableUser(request: Parameters<AuthServiceClient['enableEndUser']>[0]) {
    return this.enableEndUser(request)
  }

  /**
   * @deprecated Use updateEndUserMetadata instead
   */
  async updateUserMetadata(request: Parameters<AuthServiceClient['updateEndUserMetadata']>[0]) {
    return this.updateEndUserMetadata(request)
  }

  /**
   * @deprecated Use deleteEndUser instead
   */
  async deleteUser(request: Parameters<AuthServiceClient['deleteEndUser']>[0]) {
    return this.deleteEndUser(request)
  }

  /**
   * @deprecated Use resetEndUserPassword instead
   */
  async resetPassword(request: Parameters<AuthServiceClient['resetEndUserPassword']>[0]) {
    return this.resetEndUserPassword(request)
  }

  /**
   * @deprecated Use getEndUserSessions instead
   */
  async getUserSessions(userId: string) {
    return this.getEndUserSessions(userId)
  }

  /**
   * @deprecated Use revokeEndUserSession instead
   */
  async revokeSession(request: Parameters<AuthServiceClient['revokeEndUserSession']>[0]) {
    return this.revokeEndUserSession(request)
  }
}

/**
 * Create a Studio auth service client from a NextRequest
 * Extracts the developer portal token from the request
 */
export function createStudioClientFromRequest(req: NextRequest): StudioAuthServiceClient {
  const baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'

  return new StudioAuthServiceClient({
    baseUrl,
    getToken: async () => {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new StudioAuthError('No authentication token provided')
      }
      return authHeader.substring(7)
    },
  })
}

/**
 * Create a Studio auth service client with a specific token
 */
export function createStudioClientWithToken(token: string): StudioAuthServiceClient {
  const baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'

  return new StudioAuthServiceClient({
    baseUrl,
    getToken: async () => token,
  })
}

/**
 * Studio-specific error class
 */
export class StudioAuthError extends Error {
  public readonly code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'StudioAuthError'
    this.code = code
  }
}

/**
 * Re-export auth service client error for convenience
 */
export { AuthServiceApiClientError }
