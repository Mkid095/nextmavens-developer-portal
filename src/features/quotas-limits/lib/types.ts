/**
 * Types for Quota Reset Background Job
 */

import type { SuspensionType } from '@/features/abuse-controls/types'

/**
 * Quota that needs to be reset
 */
export interface QuotaToReset {
  projectId: string
  projectName: string
  projectSlug: string
  ownerId: string
  ownerEmail: string
  service: string
  monthlyLimit: number
  hardCap: number
  resetAt: Date
}

/**
 * Background job result interface
 */
export interface QuotaResetJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of quotas checked */
  quotasChecked: number
  /** Quotas that were reset */
  quotasReset: QuotaToReset[]
  /** Number of usage snapshots archived */
  snapshotsArchived: number
  /** Number of notifications sent successfully */
  notificationsSent: number
  /** Number of notifications that failed */
  notificationsFailed: number
  /** Number of projects auto-resumed (manual suspensions only) */
  projectsResumed: number
  /** Error message if job failed */
  error?: string
}
