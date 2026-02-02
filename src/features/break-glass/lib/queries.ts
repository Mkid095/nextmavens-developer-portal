/**
 * Query Functions for Break Glass Audit Logger
 *
 * High-level query functions that compose storage operations
 * to retrieve audit history and session trails.
 *
 * US-011: Implement Aggressive Audit Logging
 */

import { queryAdminActionsHistory, queryAuditLogs, querySessionAuditTrail } from './storage';
import type { CombinedAuditRecord, BreakGlassAuditEntry } from './types';
import { AdminActionType, AdminTargetType, type AdminSession, type AdminAction } from './admin-database';

/**
 * Query break glass audit history from both tables
 *
 * @param filters - Optional filters for the query
 * @returns Combined audit records from both tables
 *
 * @example
 * ```typescript
 * // Get all break glass actions for a project
 * const history = await getBreakGlassAuditHistory({
 *   targetId: 'proj-123',
 *   targetType: AdminTargetType.PROJECT,
 *   limit: 50,
 * });
 * ```
 */
export async function getBreakGlassAuditHistory(filters: {
  adminId?: string;
  sessionId?: string;
  targetId?: string;
  targetType?: AdminTargetType;
  action?: AdminActionType;
  limit?: number;
  offset?: number;
}): Promise<CombinedAuditRecord[]> {
  return queryAdminActionsHistory(filters);
}

/**
 * Get break glass audit logs from the standard audit_logs table
 *
 * @param filters - Optional filters for the query
 * @returns Break glass audit log entries
 *
 * @example
 * ```typescript
 * // Get all break glass audit logs for a project
 * const logs = await getBreakGlassAuditLogs({
 *   projectId: 'proj-123',
 *   limit: 50,
 * });
 * ```
 */
export async function getBreakGlassAuditLogs(filters: {
  adminId?: string;
  sessionId?: string;
  projectId?: string;
  action?: AdminActionType;
  limit?: number;
  offset?: number;
}): Promise<BreakGlassAuditEntry[]> {
  return queryAuditLogs(filters);
}

/**
 * Get complete audit trail for a specific break glass session
 *
 * @param sessionId - Break glass session ID
 * @returns Complete audit trail for the session
 *
 * @example
 * ```typescript
 * const trail = await getSessionAuditTrail('session-123');
 * console.log(`Admin ${trail.adminSession.admin_id} performed ${trail.actions.length} actions`);
 * ```
 */
export async function getSessionAuditTrail(
  sessionId: string
): Promise<{
  adminSession: AdminSession;
  actions: AdminAction[];
  auditLogs: BreakGlassAuditEntry[];
}> {
  return querySessionAuditTrail(sessionId);
}
