/**
 * Provisioning State Machine Types
 *
 * Types for the provisioning state machine that tracks each provisioning step separately.
 *
 * @see docs/prd-provisioning-state-machine.json US-001: Create Provisioning Steps Table
 */

/**
 * Provisioning step status enum
 */
export enum ProvisioningStepStatus {
  /** Step is pending execution */
  PENDING = 'pending',
  /** Step is currently running */
  RUNNING = 'running',
  /** Step completed successfully */
  SUCCESS = 'success',
  /** Step failed with error */
  FAILED = 'failed',
  /** Step was skipped (already completed or not needed) */
  SKIPPED = 'skipped',
}

/**
 * Provisioning step record from database
 */
export interface ProvisioningStep {
  /** Unique provisioning step identifier */
  id: string
  /** Reference to the project being provisioned */
  project_id: string
  /** Name of the provisioning step (e.g., create_database, setup_auth) */
  step_name: string
  /** Current status: pending, running, success, failed, skipped */
  status: ProvisioningStepStatus
  /** When the step started execution */
  started_at: Date | null
  /** When the step completed (success or failure) */
  completed_at: Date | null
  /** Human-readable error message if step failed */
  error_message: string | null
  /** Detailed error information as JSONB (error_type, stack_trace, context) */
  error_details: Record<string, unknown>
  /** Number of times this step has been retried */
  retry_count: number
  /** When this provisioning step record was created */
  created_at: Date
}

/**
 * Error details structure for failed provisioning steps
 */
export interface ProvisioningErrorDetails {
  /** Type of error that occurred */
  error_type?: string
  /** Stack trace from the error */
  stack_trace?: string
  /** Additional context about the error */
  context?: Record<string, unknown>
}

/**
 * Provisioning step creation data
 */
export interface CreateProvisioningStepInput {
  /** Reference to the project being provisioned */
  project_id: string
  /** Name of the provisioning step */
  step_name: string
  /** Initial status (defaults to pending) */
  status?: ProvisioningStepStatus
}

/**
 * Provisioning step update data
 */
export interface UpdateProvisioningStepInput {
  /** Current status */
  status?: ProvisioningStepStatus
  /** When the step started execution */
  started_at?: Date | null
  /** When the step completed */
  completed_at?: Date | null
  /** Error message if step failed */
  error_message?: string | null
  /** Error details as JSONB */
  error_details?: Record<string, unknown>
  /** Number of times retried */
  retry_count?: number
}

/**
 * Query parameters for fetching provisioning steps
 */
export interface ProvisioningStepsQuery {
  /** Filter by project ID */
  project_id?: string
  /** Filter by status */
  status?: ProvisioningStepStatus
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}
