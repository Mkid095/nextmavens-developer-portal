/**
 * Override Suspension Power - Type Definitions
 *
 * Types for the override suspension break glass power.
 * This allows platform operators to override auto-suspension
 * and increase hard caps if needed for legitimate high-usage projects.
 *
 * US-005: Implement Override Suspension Power
 */

/**
 * Request body for overriding suspension
 */
export interface OverrideSuspensionRequest {
  /** Break glass session token (can be in body or header) */
  break_glass_token?: string;

  /** Optional reason/context for the override */
  reason?: string;

  /** Whether to clear suspension flags (default: true) */
  clear_suspension_flags?: boolean;

  /** Optional new hard caps to set (increases limits) */
  new_hard_caps?: Array<{
    /** Cap type (e.g., 'api_requests_per_minute', 'storage_mb') */
    type: string;
    /** New cap value */
    value: number;
  }>;

  /** Optional percentage to increase all existing caps */
  increase_caps_by_percent?: number;
}

/**
 * Response after successful override
 */
export interface OverrideSuspensionResponse {
  success: true;
  project: OverrideProjectState;
  action_log: OverrideActionLog;
  warning?: string;
}

/**
 * Project state after override
 */
export interface OverrideProjectState {
  id: string;
  name: string;
  status: string;
  previous_status: string;
  overridden_at: Date;
  suspension_cleared: boolean;
  previous_suspension?: {
    cap_exceeded: string;
    reason: string;
    suspended_at: Date;
    notes: string | null;
  };
  caps_updated?: boolean;
  new_caps?: Array<{
    type: string;
    previous_value: number;
    new_value: number;
  }>;
}

/**
 * Action log entry for the override operation
 */
export interface OverrideActionLog {
  id: string;
  session_id: string;
  action: string;
  target_type: string;
  target_id: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  logged_at: Date;
}

/**
 * Error response for override operation
 */
export interface OverrideSuspensionError {
  error: string;
  details: string;
  code:
    | 'INVALID_TOKEN'
    | 'EXPIRED_TOKEN'
    | 'PROJECT_NOT_FOUND'
    | 'OVERRIDE_FAILED'
    | 'INVALID_CAPS'
    | 'UNAUTHORIZED';
}
