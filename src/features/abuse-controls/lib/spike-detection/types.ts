/**
 * Spike Detection Types
 * Re-export the job result interface
 */

import type { SpikeDetectionResult } from '../../types'

/**
 * Background job result interface
 */
export interface SpikeDetectionJobResult {
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
  /** Number of spikes detected */
  spikesDetected: number
  /** Details of detected spikes */
  detectedSpikes: SpikeDetectionResult[]
  /** Breakdown by action type */
  actionsTaken: {
    warnings: number
    suspensions: number
  }
  /** Error message if job failed */
  error?: string
}
