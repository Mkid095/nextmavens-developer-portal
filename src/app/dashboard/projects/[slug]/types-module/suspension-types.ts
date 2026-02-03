/**
 * Project Types Module - Suspension Types
 */

/**
 * Suspension reason details
 */
export interface SuspensionReason {
  cap_type: string
  current_value: number
  limit_exceeded: number
  details?: string
}

/**
 * Suspension record from database
 */
export interface SuspensionRecord {
  id: string
  project_id: string
  reason: SuspensionReason
  cap_exceeded: string
  suspended_at: string
  resolved_at: string | null
  notes?: string
}

/**
 * Suspension status response
 */
export interface SuspensionStatusResponse {
  suspended: boolean
  suspension?: SuspensionRecord
  message?: string
}
