/**
 * Auth Service API Client
 * @deprecated Re-exports from auth-service-client module for backward compatibility
 * Import from './auth-service-client' instead
 *
 * Client for interacting with the auth service for user management.
 */

export * from './auth-service-client/types'
export { AuthServiceClient } from './auth-service-client/client'
export { AuthServiceApiClientError } from './auth-service-client/error'
export {
  createAuthServiceClient,
  requireAuthServiceClient,
  getAuthServiceClient,
  authServiceClient,
} from './auth-service-client/instance'
