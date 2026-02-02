/**
 * Suspension Library
 * @deprecated Re-exports from suspensions module for backward compatibility
 * Import from './suspensions' instead
 *
 * Manages project suspensions due to hard cap violations.
 * Provides functions to suspend, unsuspend, and check suspension status.
 */

export { suspendProject, unsuspendProject } from './suspensions/actions'
export {
  getSuspensionStatus,
  isCapExceeded,
  checkAllProjectsForSuspension,
  getAllActiveSuspensions,
  getSuspensionHistory,
} from './suspensions/checks'
export * from './suspensions/types'
