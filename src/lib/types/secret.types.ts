/**
 * Types for Secret Management API
 * PRD: US-004 from prd-secrets-versioning.json
 */

/**
 * Secret model as stored in database
 */
export interface Secret {
  id: string
  project_id: string
  name: string
  value_encrypted: string // Never returned in API responses
  version: number
  active: boolean
  rotated_from?: string | null // ID of previous version
  rotation_reason?: string | null
  created_by?: string | null
  created_at: string
}

/**
 * Secret response without value (safe to return)
 */
export interface SecretResponse {
  id: string
  project_id: string
  name: string
  version: number
  active: boolean
  rotated_from?: string | null
  rotation_reason?: string | null
  created_at: string
}

/**
 * Request to create a new secret
 */
export interface CreateSecretRequest {
  project_id: string
  name: string
  value: string // Plain text value to be encrypted
}

/**
 * Response from create secret endpoint
 */
export interface CreateSecretResponse {
  success: boolean
  data: SecretResponse
}

/**
 * Request to rotate a secret
 */
export interface RotateSecretRequest {
  value: string // New plain text value
  rotation_reason?: string
}

/**
 * Response from rotate secret endpoint
 */
export interface RotateSecretResponse {
  success: boolean
  data: SecretResponse
}

/**
 * List secrets query parameters
 */
export interface ListSecretsQuery {
  project_id: string
  active?: boolean
  limit?: number
  offset?: number
}

/**
 * List secrets response
 */
export interface ListSecretsResponse {
  success: boolean
  data: SecretResponse[]
  meta?: {
    limit: number
    offset: number
    total: number
  }
}

/**
 * Get secret response (with decrypted value)
 */
export interface GetSecretResponse {
  success: boolean
  data: SecretResponse & {
    value: string // Decrypted value (only returned when explicitly requested)
  }
}

/**
 * List secret versions response
 */
export interface ListSecretVersionsResponse {
  success: boolean
  data: SecretResponse[]
}
