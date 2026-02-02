/**
 * Error Rate Detection Types
 * Type definitions for the error rate detection background job
 */

import type { ErrorRateDetectionResult } from '../types'

/**
 * Background job result interface
 */
export interface ErrorRateDetectionJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of projects checked */
  projectsChecked: number
  /** Number of high error rates detected */
  errorRatesDetected: number
  /** Details of detected error rates */
  detectedErrorRates: ErrorRateDetectionResult[]
  /** Breakdown by action type */
  actionsTaken: {
    warnings: number
    investigations: number
  }
  /** Error message if job failed */
  error?: string
}
