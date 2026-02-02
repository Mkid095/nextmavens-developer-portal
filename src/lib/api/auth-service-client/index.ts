/**
 * Auth Service API Client
 *
 * Client for interacting with the auth service for user management.
 */

export * from './types'
export { AuthServiceClient } from './client'
export { AuthServiceApiClientError } from './error'
export {
  createAuthServiceClient,
  requireAuthServiceClient,
  getAuthServiceClient,
  authServiceClient,
} from './instance'
