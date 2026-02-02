/**
 * Override Suspension Types
 */

export interface HardCapUpdate {
  type: string
  previous_value: number
  new_value: number
}

/**
 * Override suspension operation parameters
 */
export interface OverrideSuspensionParams {
  /** Project ID to override */
  projectId: string

  /** Break glass session ID */
  sessionId: string

  /** Admin ID performing the override */
  adminId: string

  /** Optional reason/context for the override */
  reason?: string

  /** Whether to clear suspension flags (default: true) */
  clearSuspensionFlags?: boolean

  /** Optional new hard caps to set */
  newHardCaps?: Array<{ type: string; value: number }>

  /** Optional percentage to increase all existing caps */
  increaseCapsByPercent?: number
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
