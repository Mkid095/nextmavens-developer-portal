/**
 * Secrets Type Definitions
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Type definitions for secrets management UI
 */

/**
 * Secret object (list view - without value)
 */
export interface Secret {
  id: string
  project_id: string
  name: string
  version: number
  active: boolean
  rotated_from: string | null
  rotation_reason: string | null
  created_at: string
  grace_period_ends_at: string | null
  grace_period_warning_sent_at: string | null
}

/**
 * Secret details (with decrypted value)
 */
export interface SecretDetails extends Secret {
  value: string
  project_name?: string
}

/**
 * Secret version object (for version history)
 */
export interface SecretVersion {
  id: string
  name: string
  version: number
  active: boolean
  rotated_from: string | null
  rotated_from_name?: string
  rotation_reason: string | null
  created_at: string
  created_by: string
  grace_period_ends_at: string | null
  grace_period_warning_sent_at: string | null
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    limit: number
    offset: number
    total: number
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * Create secret request
 */
export interface CreateSecretRequest {
  project_id: string
  name: string
  value: string
}

/**
 * Rotate secret request
 */
export interface RotateSecretRequest {
  value: string
  rotation_reason?: string
}

/**
 * Rotate secret response
 */
export interface RotateSecretResponse {
  id: string
  project_id: string
  name: string
  version: number
  active: boolean
  rotated_from: string | null
  rotation_reason: string | null
  created_at: string
  oldSecret: {
    id: string
    gracePeriodEndsAt: string | null
  }
  gracePeriodHours: number
}

/**
 * Delete secret response
 */
export interface DeleteSecretResponse {
  deleted: boolean
  secretName: string
  versionsDeleted: number
  deletedAt: string
  hardDeleteScheduledAt: string
  hardDeleteAfterDays: number
}

/**
 * Secret consumer (for tracking which services use each secret)
 * From US-002: Create Secret Consumers Table
 */
export interface SecretConsumer {
  secret_id: string
  service: 'edge_function' | 'worker' | 'webhook' | 'api_gateway' | 'scheduled_job' | 'custom'
  last_used_at: string | null
  created_at: string
}
