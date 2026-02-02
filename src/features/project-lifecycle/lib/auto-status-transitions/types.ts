/**
 * Auto Status Transitions Types
 * Type definitions for the auto status transitions background job
 */

import { ProjectLifecycleStatus } from '@/features/project-lifecycle/types/project-status.types'

/**
 * Result of a status transition operation
 */
export interface StatusTransitionResult {
  projectId: string
  projectName: string
  previousStatus: ProjectLifecycleStatus
  newStatus: ProjectLifecycleStatus
  reason: string
  transitionedAt: Date
}

/**
 * Background job result interface
 */
export interface AutoStatusTransitionsJobResult {
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
  /** Number of status transitions made */
  transitionsMade: number
  /** Details of transitions */
  transitions: StatusTransitionResult[]
  /** Error message if job failed */
  error?: string
}
