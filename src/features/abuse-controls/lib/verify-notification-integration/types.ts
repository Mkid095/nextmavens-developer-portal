/**
 * Verify Notification Integration - Type Definitions
 */

/**
 * Verification result
 */
export interface VerificationResult {
  name: string
  passed: boolean
  message: string
  details?: Record<string, unknown>
}

/**
 * Complete verification report
 */
export interface VerificationReport {
  success: boolean
  checks: VerificationResult[]
  summary: string
}
