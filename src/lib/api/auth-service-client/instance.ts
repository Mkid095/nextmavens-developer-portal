/**
 * Auth Service API Client - Instance Management
 *
 * Singleton instance management for the auth service client.
 */

import { AuthServiceClient } from './client'

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
