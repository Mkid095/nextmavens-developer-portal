/**
 * Force Delete Project Types
 *
 * Type definitions for the force delete project break glass power.
 * This operation allows platform operators to immediately delete projects
 * without any grace period, with full audit logging.
 *
 * US-006: Implement Force Delete Power (Break Glass Mode)
 *
 * @example
 * ```typescript
 * import { ForceDeleteProjectRequest, ForceDeleteProjectResponse } from '@/features/break-glass/types/force-delete-project.types';
 *
 * // Request to force delete a project
 * const request: ForceDeleteProjectRequest = {
 *   break_glass_token: 'session-uuid-123',
 *   reason: 'Security incident - immediate removal required',
 * };
 *
 * // Response after force deletion
 * const response: ForceDeleteProjectResponse = {
 *   success: true,
 *   deleted_project: {
 *     id: 'proj-456',
 *     name: 'Compromised Project',
 *     status: 'DELETED',
 *     deleted_at: '2026-01-30T10:00:00Z',
 *   },
 *   action_log: {
 *     id: 'action-789',
 *     session_id: 'session-uuid-123',
 *     action: 'force_delete',
 *     logged_at: '2026-01-30T10:00:00Z',
 *   },
 * };
 * ```
 */

/**
 * Request body for force deleting a project
 */
export interface ForceDeleteProjectRequest {
  /** Break glass session token from admin authentication */
  break_glass_token: string;

  /** Additional context for this force delete operation */
  reason?: string;

  /** Whether to clean up all associated resources (default: true) */
  cleanup_resources?: boolean;
}

/**
 * Project state that was deleted
 */
export interface DeletedProjectState {
  /** Project ID */
  id: string;

  /** Project name */
  name: string;

  /** Status before deletion */
  status: string;

  /** Timestamp when project was deleted */
  deleted_at: Date;

  /** Tenant ID */
  tenant_id: string;

  /** Developer ID */
  developer_id: string;

  /** Environment (production/staging) */
  environment?: string;

  /** When the project was originally created */
  created_at?: Date;
}

/**
 * Resources that were cleaned up
 */
export interface CleanupResources {
  /** Number of API keys deleted */
  api_keys_deleted: number;

  /** Number of service accounts deleted */
  service_accounts_deleted: number;

  /** Number of webhooks deleted */
  webhooks_deleted: number;

  /** Whether suspension record was cleared */
  suspension_cleared: boolean;

  /** Any other resources cleaned up */
  other_resources?: string[];
}

/**
 * Action log entry for the force delete operation
 */
export interface ForceDeleteActionLog {
  /** Action ID */
  id: string;

  /** Session ID that performed this action */
  session_id: string;

  /** Action type (should be 'force_delete') */
  action: string;

  /** Target type (should be 'project') */
  target_type: string;

  /** Target project ID */
  target_id: string;

  /** State before deletion */
  before_state: Record<string, unknown>;

  /** State after deletion (should be empty/deleted) */
  after_state: Record<string, unknown>;

  /** When the action was logged */
  logged_at: Date;
}

/**
 * Response from force delete project endpoint
 */
export interface ForceDeleteProjectResponse {
  /** Whether the force delete operation succeeded */
  success: boolean;

  /** The deleted project state */
  deleted_project: DeletedProjectState;

  /** Resources that were cleaned up */
  resources_cleaned?: CleanupResources;

  /** The audit log entry for this action */
  action_log: ForceDeleteActionLog;

  /** Warning message if applicable */
  warning?: string;
}

/**
 * Error response from force delete project endpoint
 */
export interface ForceDeleteProjectError {
  /** Error message */
  error: string;

  /** Detailed error description */
  details?: string;

  /** Error code for categorization */
  code?: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'PROJECT_NOT_FOUND' | 'FORCE_DELETE_FAILED';
}

/**
 * Options for force delete operation
 */
export interface ForceDeleteProjectOptions {
  /** Whether to verify session before deleting (default: true) */
  verify_session?: boolean;

  /** Whether to log the action (default: true) */
  log_action?: boolean;

  /** Custom timeout for operation (default: 30000ms) */
  timeout?: number;

  /** Whether to cleanup all associated resources (default: true) */
  cleanup_resources?: boolean;
}

/**
 * Validation result for force delete request
 */
export interface ForceDeleteRequestValidation {
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
