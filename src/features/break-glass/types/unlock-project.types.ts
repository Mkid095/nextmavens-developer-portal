/**
 * Unlock Project Types
 *
 * Type definitions for the unlock project break glass power.
 * This operation allows platform operators to unlock suspended projects
 * regardless of the suspension reason, with full audit logging.
 *
 * US-004: Implement Unlock Project Power (Break Glass Mode)
 *
 * @example
 * ```typescript
 * import { UnlockProjectRequest, UnlockProjectResponse } from '@/features/break-glass/types/unlock-project.types';
 *
 * // Request to unlock a project
 * const request: UnlockProjectRequest = {
 *   break_glass_token: 'session-uuid-123',
 *   reason: 'False positive suspension - customer verified legitimate usage',
 * };
 *
 * // Response after unlocking
 * const response: UnlockProjectResponse = {
 *   success: true,
 *   project: {
 *     id: 'proj-456',
 *     status: 'ACTIVE',
 *     previous_status: 'SUSPENDED',
 *     unlocked_at: '2026-01-29T19:00:00Z',
 *   },
 *   action_log: {
 *     id: 'action-789',
 *     session_id: 'session-uuid-123',
 *     action: 'unlock_project',
 *     logged_at: '2026-01-29T19:00:00Z',
 *   },
 * };
 * ```
 */

/**
 * Request body for unlocking a project
 */
export interface UnlockProjectRequest {
  /** Break glass session token from admin authentication */
  break_glass_token: string;

  /** Additional context for this unlock operation */
  reason?: string;

  /** Whether to clear suspension flags (default: true) */
  clear_suspension_flags?: boolean;
}

/**
 * Project state after unlock operation
 */
export interface UnlockedProjectState {
  /** Project ID */
  id: string;

  /** Project name */
  name: string;

  /** New status after unlock (should be ACTIVE) */
  status: string;

  /** Previous status before unlock */
  previous_status: string;

  /** Timestamp when project was unlocked */
  unlocked_at: Date;

  /** Previous suspension state (if any) */
  previous_suspension?: {
    /** Which cap was exceeded */
    cap_exceeded: string | null;

    /** Reason for suspension */
    reason: string | null;

    /** When the project was suspended */
    suspended_at: Date | null;

    /** Any additional notes */
    notes: string | null;
  };
}

/**
 * Action log entry for the unlock operation
 */
export interface UnlockActionLog {
  /** Action ID */
  id: string;

  /** Session ID that performed this action */
  session_id: string;

  /** Action type (should be 'unlock_project') */
  action: string;

  /** Target type (should be 'project') */
  target_type: string;

  /** Target project ID */
  target_id: string;

  /** State before unlock */
  before_state: Record<string, unknown>;

  /** State after unlock */
  after_state: Record<string, unknown>;

  /** When the action was logged */
  logged_at: Date;
}

/**
 * Response from unlock project endpoint
 */
export interface UnlockProjectResponse {
  /** Whether the unlock operation succeeded */
  success: boolean;

  /** The unlocked project state */
  project: UnlockedProjectState;

  /** The audit log entry for this action */
  action_log: UnlockActionLog;

  /** Warning message if applicable */
  warning?: string;
}

/**
 * Error response from unlock project endpoint
 */
export interface UnlockProjectError {
  /** Error message */
  error: string;

  /** Detailed error description */
  details?: string;

  /** Error code for categorization */
  code?: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'PROJECT_NOT_FOUND' | 'UNLOCK_FAILED';
}

/**
 * Options for unlock operation
 */
export interface UnlockProjectOptions {
  /** Whether to verify session before unlocking (default: true) */
  verify_session?: boolean;

  /** Whether to log the action (default: true) */
  log_action?: boolean;

  /** Custom timeout for operation (default: 30000ms) */
  timeout?: number;
}

/**
 * Validation result for unlock request
 */
export interface UnlockRequestValidation {
  /** Whether the request is valid */
  valid: boolean;

  /** Validation errors if invalid */
  errors?: Array<{
    field: string;
    message: string;
  }>;

  /** Warnings (non-blocking issues) */
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}
