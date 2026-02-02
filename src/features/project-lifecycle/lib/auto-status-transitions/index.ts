/**
 * Auto Status Transitions Index
 * Re-exports all types, utilities, and functions for the auto status transitions background job
 */

// Types
export type { StatusTransitionResult, AutoStatusTransitionsJobResult } from './types'

// Utils
export { systemActor } from './utils'

// Transitions
export {
  transitionCreatedToActive,
  transitionActiveToSuspended,
  transitionSuspendedToActive,
} from './transitions'

// Main job
export { runAutoStatusTransitionsJob } from './job'
