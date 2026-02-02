/**
 * Type Definitions for Break Glass Audit Logger
 *
 * Shared type definitions used across the break glass audit logging system.
 *
 * US-011: Implement Aggressive Audit Logging
 */

import {
  AdminActionType,
  AdminTargetType,
  type AdminSession,
  type AdminAction,
} from './admin-database';

/**
 * Break glass audit log entry parameters
 */
export interface BreakGlassAuditParams {
  /** Admin developer ID performing the action */
  adminId: string;

  /** Break glass session ID */
  sessionId: string;

  /** Type of action performed */
  action: AdminActionType;

  /** Type of target affected */
  targetType: AdminTargetType;

  /** ID of the target resource */
  targetId: string;

  /** State before the action */
  beforeState: Record<string, unknown>;

  /** State after the action */
  afterState: Record<string, unknown>;

  /** Optional additional metadata */
  metadata?: Record<string, unknown>;

  /** Optional IP address of the admin */
  ipAddress?: string;

  /** Optional user agent of the admin */
  userAgent?: string;

  /** Optional project ID (if target is project-related) */
  projectId?: string;

  /** Optional developer ID (if target is developer-related) */
  developerId?: string;
}

/**
 * Break glass audit log entry (from audit_logs query)
 */
export interface BreakGlassAuditEntry {
  id: string;
  log_type: string;
  severity: string;
  project_id: string | null;
  developer_id: string | null;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  occurred_at: Date;
}

/**
 * Combined audit record (admin_actions + audit_logs)
 */
export interface CombinedAuditRecord {
  /** Admin action from admin_actions table */
  adminAction: AdminAction;

  /** Admin session details */
  adminSession: AdminSession;

  /** Standard audit log entry */
  auditLog?: BreakGlassAuditEntry;
}
