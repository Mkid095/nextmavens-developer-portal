/**
 * Regenerate Keys Types
 */

/**
 * Regenerate keys operation parameters
 */
export interface RegenerateKeysParams {
  /** Project ID to regenerate keys for */
  projectId: string

  /** Break glass session ID */
  sessionId: string

  /** Admin ID performing the regeneration */
  adminId: string

  /** Optional reason/context for the regeneration */
  reason?: string

  /** Whether to invalidate all existing keys (default: true) */
  invalidateAll?: boolean

  /** Number of service_role keys to generate (default: 1) */
  keyCount?: number

  /** Environment for new keys (default: 'live') */
  environment?: 'live' | 'test' | 'dev'
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
}
