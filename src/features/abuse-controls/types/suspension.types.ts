/**
 * Suspension Types
 * Types for project suspension and status management
 */

import { HardCapType } from './quota.types'

/**
 * Project status enum
 */
export enum ProjectStatus {
  /** Project is active and operational */
  ACTIVE = 'active',
  /** Project is suspended due to cap violations or abuse */
  SUSPENDED = 'suspended',
}

/**
 * Suspension reason details
 */
export interface SuspensionReason {
  /** The type of cap that was exceeded */
  cap_type: HardCapType
  /** Current usage value */
  current_value: number
  /** The limit that was exceeded */
  limit_exceeded: number
  /** Additional context about the suspension */
  details?: string
}

/**
 * Suspension type enum
 * PRD: US-010 - Implement Auto-Status Transitions
 */
export enum SuspensionType {
  /** Suspended manually by a platform operator */
  MANUAL = 'manual',
  /** Suspended automatically by the background job for quota violations */
  AUTOMATIC = 'automatic',
}

/**
 * Suspension record for tracking project suspensions
 */
export interface SuspensionRecord {
  /** Unique identifier for the suspension */
  id: string
  /** Project ID that was suspended */
  project_id: string
  /** Reason for suspension */
  reason: SuspensionReason
  /** The specific cap that was exceeded */
  cap_exceeded: HardCapType
  /** When the suspension was applied */
  suspended_at: Date
  /** When the suspension was resolved (null if still suspended) */
  resolved_at: Date | null
  /** Optional notes about the suspension */
  notes?: string
  /** Type of suspension (manual or automatic) */
  suspension_type?: SuspensionType
}

/**
 * Suspension history entry for audit trail
 */
export interface SuspensionHistoryEntry {
  /** Unique identifier for the history entry */
  id: string
  /** Project ID */
  project_id: string
  /** Action taken (suspended/unsuspended) */
  action: 'suspended' | 'unsuspended'
  /** Reason for the action */
  reason: SuspensionReason
  /** When the action occurred */
  occurred_at: Date
  /** Optional notes about the action */
  notes?: string
}
