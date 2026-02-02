/**
 * Manual Overrides Library
 *
 * Provides manual override functionality for administrators to handle edge cases.
 * Allows operators to:
 * - Unsuspend suspended projects
 * - Increase hard caps for projects
 * - Both unsuspend and increase caps
 *
 * All overrides are fully audited with reason, performer, and timestamp.
 *
 * This module re-exports all functions from the refactored sub-modules
 * for backward compatibility.
 */

// Validation
export { validateManualOverrideRequest } from './manual-overrides/validation'

// Database operations
export {
  getProjectStatus,
  getAllCaps,
  getOverrideHistory,
  getProjectOverrides,
  getAllOverrides,
  getOverrideStatistics,
  getOverrideById,
  createOverrideRecord,
} from './manual-overrides/database'

// Notifications
export {
  logManualOverride,
  logOverrideCompletion,
  logOverrideError,
} from './manual-overrides/notifications'

// Workflow
export { performManualOverride } from './manual-overrides/workflow'

// Type exports for convenience
export type {
  ManualOverrideAction,
  ManualOverrideRequest,
  ManualOverrideResult,
  OverrideRecord,
  PreviousStateSnapshot,
} from '../types'
