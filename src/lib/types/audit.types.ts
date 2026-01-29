/**
 * Audit Log Viewer Types
 *
 * Type definitions for the audit log viewer UI.
 * These types match the API response structure from the audit log endpoint.
 *
 * US-009: Create Audit Log Viewer UI
 */

import type { AuditLog, ActorType } from '@nextmavens/audit-logs-database';

/**
 * Audit log API response
 * Matches the response from GET /api/audit
 */
export interface AuditLogApiResponse {
  data: AuditLogEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

/**
 * Audit log entry for UI display
 * Serializes Date objects to strings for JSON transmission
 */
export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_type: ActorType;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string; // ISO 8601 date string
}

/**
 * Query parameters for fetching audit logs
 */
export interface AuditLogQueryParams {
  action?: string;
  target_type?: string;
  request_id?: string;
  start_date?: string; // ISO 8601 date string
  end_date?: string; // ISO 8601 date string
  limit?: number;
  offset?: number;
}

/**
 * Filter state for the audit log viewer
 */
export interface AuditLogFilters {
  action: string;
  targetType: string;
  requestId: string;
  startDate: string;
  endDate: string;
}

/**
 * Available action types for filtering
 */
export const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'project.created', label: 'Project Created' },
  { value: 'project.updated', label: 'Project Updated' },
  { value: 'project.deleted', label: 'Project Deleted' },
  { value: 'project.suspended', label: 'Project Suspended' },
  { value: 'project.auto_suspended', label: 'Project Auto Suspended' },
  { value: 'key.created', label: 'API Key Created' },
  { value: 'key.rotated', label: 'API Key Rotated' },
  { value: 'key.revoked', label: 'API Key Revoked' },
  { value: 'user.invited', label: 'User Invited' },
  { value: 'user.removed', label: 'User Removed' },
  { value: 'user.role_changed', label: 'User Role Changed' },
  { value: 'secret.created', label: 'Secret Created' },
  { value: 'secret.accessed', label: 'Secret Accessed' },
  { value: 'secret.rotated', label: 'Secret Rotated' },
] as const;

/**
 * Available target types for filtering
 */
export const TARGET_TYPES = [
  { value: '', label: 'All Targets' },
  { value: 'project', label: 'Project' },
  { value: 'api_key', label: 'API Key' },
  { value: 'user', label: 'User' },
  { value: 'secret', label: 'Secret' },
  { value: 'organization', label: 'Organization' },
  { value: 'team', label: 'Team' },
] as const;

/**
 * Actor type labels for display
 */
export const ACTOR_TYPE_LABELS: Record<ActorType, string> = {
  user: 'User',
  system: 'System',
  api_key: 'API Key',
  project: 'Project',
};
