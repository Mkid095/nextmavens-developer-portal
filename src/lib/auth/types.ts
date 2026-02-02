/**
 * Authentication Types
 */

export interface AuthenticatedEntity {
  id: string
  email: string
}

export interface Developer extends AuthenticatedEntity {
  name: string
  organization?: string
}

export interface JwtPayload extends AuthenticatedEntity {
  project_id: string
}
