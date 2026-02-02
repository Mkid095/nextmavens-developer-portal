/**
 * Manual Override Types
 * Types for manual override operations
 */

import { HardCapType } from './quota.types'
import { ProjectStatus } from './suspension.types'

/**
 * Manual override action types
 * Defines the types of manual overrides that can be performed
 */
export enum ManualOverrideAction {
  /** Unsuspend a suspended project */
  UNSUSPEND = 'unsuspend',
  /** Increase hard caps for a project */
  INCREASE_CAPS = 'increase_caps',
  /** Both unsuspend and increase caps */
  BOTH = 'both',
}

/**
 * Manual override request parameters
 * Required input for performing a manual override
 */
export interface ManualOverrideRequest {
  /** Project ID to override */
  projectId: string
  /** Action to perform (unsuspend, increase caps, or both) */
  action: ManualOverrideAction
  /** Reason for the override (required for audit) */
  reason: string
  /** Optional new cap values to set */
  newCaps?: Partial<Record<HardCapType, number>>
  /** Optional additional notes or context */
  notes?: string
}

/**
 * Previous state snapshot for audit purposes
 */
export interface PreviousStateSnapshot {
  /** Previous project status */
  previousStatus: ProjectStatus
  /** Previous cap values */
  previousCaps: Record<HardCapType, number>
  /** Whether project was suspended */
  wasSuspended: boolean
}

/**
 * Manual override result
 * Result returned after performing a manual override
 */
export interface ManualOverrideResult {
  /** Whether the override was successful */
  success: boolean
  /** The override record that was created */
  overrideRecord: OverrideRecord
  /** Previous state before the override */
  previousState: PreviousStateSnapshot
  /** Current state after the override */
  currentState: {
    /** New project status */
    status: ProjectStatus
    /** New cap values (if changed) */
    caps?: Record<HardCapType, number>
  }
  /** Error message if override failed */
  error?: string
}

/**
 * Override record for database storage
 * Tracks manual overrides performed by administrators
 */
export interface OverrideRecord {
  /** Unique identifier for the override */
  id: string
  /** Project ID that was overridden */
  project_id: string
  /** Action that was performed */
  action: ManualOverrideAction
  /** Reason for the override */
  reason: string
  /** Additional notes or context */
  notes?: string
  /** Previous cap values before override */
  previous_caps: Record<HardCapType, number>
  /** New cap values after override (if changed) */
  new_caps?: Record<HardCapType, number>
  /** User ID who performed the override */
  performed_by: string
  /** When the override was performed */
  performed_at: Date
  /** IP address of the performer (if available) */
  ip_address?: string
  /** Previous project status */
  previous_status: ProjectStatus
  /** New project status after override */
  new_status: ProjectStatus
}
