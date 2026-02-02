/**
 * Auth Service API Client
 * @deprecated Re-exports from auth-service-client module for backward compatibility
 * Import from './api/auth-service-client' instead
 *
 * Client for interacting with the auth service for user management.
 */

export * from './api/auth-service-client/types'
export { AuthServiceClient } from './api/auth-service-client/client'
export { AuthServiceApiClientError } from './api/auth-service-client/error'
export {
  createAuthServiceClient,
  requireAuthServiceClient,
  getAuthServiceClient,
  authServiceClient,
} from './api/auth-service-client/instance'
