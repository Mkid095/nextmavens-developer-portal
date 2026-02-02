/**
 * Provisioning State Machine
 *
 * Step-aware provisioning system that enables safe retry from failure.
 * Handles state transitions: PENDING → RUNNING → SUCCESS/FAILED
 *
 * Story: US-003 - Implement State Machine Logic
 * PRD: Provisioning State Machine
 *
 * This file now serves as the main entry point, re-exporting from the modular structure:
 * - state-machine/state-definitions.ts: State retrieval and calculation functions
 * - state-machine/transitions.ts: State transition and database update functions
 * - state-machine/validation.ts: Validation logic for state transitions
 * - state-machine/run-step.ts: Step execution orchestration
 * - state-machine/retry-step.ts: Step retry orchestration
 */

// Main orchestration functions
export { runProvisioningStep } from './state-machine/run-step'
export { retryProvisioningStep } from './state-machine/retry-step'

// State retrieval and calculation functions
export {
  getStepStatus,
  getAllSteps,
  calculateProgress,
  isProvisioningComplete,
  hasProvisioningFailed,
  getNextPendingStep,
} from './state-machine/state-definitions'

// Validation functions
export {
  isValidStateTransition,
  getRemainingRetries,
  canRetryStep,
} from './state-machine/validation'

// Types
export type { RunProvisioningStepResult } from './state-machine/run-step'
export type { RetryProvisioningStepResult } from './state-machine/retry-step'
