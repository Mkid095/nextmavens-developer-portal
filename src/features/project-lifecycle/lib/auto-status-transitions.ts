/**
 * Auto Status Transitions Background Job
 *
 * Handles automatic project status transitions based on events:
 * 1. CREATED → ACTIVE after provisioning completes successfully
 * 2. ACTIVE → SUSPENDED when hard cap is exceeded
 * 3. SUSPENDED → ACTIVE after quota reset (if suspension was due to quota)
 *
 * Story: US-010 from prd-project-lifecycle.json
 *
 * @module auto-status-transitions
 */

// Re-export all types, utilities, transition functions, and the main job
export {
  // Types
  type StatusTransitionResult,
  type AutoStatusTransitionsJobResult,

  // Utils
  systemActor,

  // Transitions
  transitionCreatedToActive,
  transitionActiveToSuspended,
  transitionSuspendedToActive,

  // Main job
  runAutoStatusTransitionsJob,
} from './auto-status-transitions'
