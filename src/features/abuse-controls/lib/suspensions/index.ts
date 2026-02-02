/**
 * Suspensions Module
 *
 * Manages project suspensions due to hard cap violations.
 * Provides functions to suspend, unsuspend, and check suspension status.
 */

export { suspendProject, unsuspendProject } from './actions'
export {
  getSuspensionStatus,
  isCapExceeded,
  checkAllProjectsForSuspension,
  getAllActiveSuspensions,
  getSuspensionHistory,
} from './checks'
export * from './types'
