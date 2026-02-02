/**
 * Authentication Library - Type Definitions
 */

/**
 * Common base type for authenticated entities
 * Used for type compatibility between Developer and JwtPayload
 */
export interface AuthenticatedEntity {
  id: string
  email: string
}

/**
 * JWT payload with project_id claim.
 * US-001: Require project_id in JWT
 */
export interface JwtPayload extends AuthenticatedEntity {
  project_id: string
}

/**
 * Developer user information
 */
export interface Developer extends AuthenticatedEntity {
  name: string
  organization?: string
}

/**
 * API Key interface for authentication result
 */
export interface ApiKeyAuth {
  id: string
  project_id: string
  developer_id: string
  key_type: string
  key_prefix: string
  scopes: string[]
  environment: string
  name: string
  created_at: string
}
