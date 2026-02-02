/**
 * Audit Event Handlers for Break Glass Audit Logger
 *
 * Handles high-level audit events including logging break glass actions,
 * sending notifications, and coordinating multi-table audit writes.
 *
 * US-011: Implement Aggressive Audit Logging
 */

import { logAuditEntry } from '@/features/abuse-controls/lib/audit-logger';
import { sendBreakGlassActionNotification } from './notifications';
import { insertAdminAction, getAdminSessionDetails } from './storage';
import { getActionDescription, getAuditLogType, getSeverityLevel } from './formatters';
import {
  AdminActionType,
  AdminTargetType,
  type AdminAction,
} from './admin-database';
import type { BreakGlassAuditParams } from './types';

/**
 * Send notification for a break glass action
 *
 * @param params - Break glass audit parameters
 * @param adminAction - The created admin action
 *
 * @example
 * ```typescript
 * await sendActionNotification(params, adminAction);
 * ```
 */
async function sendActionNotification(
  params: BreakGlassAuditParams,
  adminAction: AdminAction
): Promise<void> {
  const { adminId, sessionId, action, targetType, targetId, beforeState, afterState, ipAddress } = params;

  try {
    const sessionDetails = await getAdminSessionDetails(sessionId);

    if (sessionDetails) {
      await sendBreakGlassActionNotification({
        adminEmail: sessionDetails.email || 'unknown@example.com',
        adminId: adminId,
        sessionId: sessionId,
        sessionReason: sessionDetails.reason || 'No reason provided',
        action: action,
        targetType: targetType,
        targetId: targetId,
        beforeState: beforeState,
        afterState: afterState,
        ipAddress: ipAddress,
      });
      console.log(`[BreakGlassAudit] Action notification sent for action ${adminAction.id}`);
    }
  } catch (error) {
    // Log notification error but don't fail the audit logging
    console.error('[BreakGlassAudit] Failed to send action notification:', error);
    // The action is still logged, just the notification failed
  }
}

/**
 * Aggressively log a break glass action to BOTH audit trails
 *
 * This function:
 * 1. Logs to admin_actions table (break glass specific)
 * 2. Logs to audit_logs table (standard platform audit)
 * 3. Sends email notification about the action
 * 4. Includes full context: admin, session, action, target, before/after states
 *
 * @param params - Break glass audit parameters
 * @returns The created admin action record
 * @throws Error if logging fails (fail closed - don't allow action without audit)
 *
 * @example
 * ```typescript
 * const action = await logBreakGlassAction({
 *   adminId: 'admin-123',
 *   sessionId: 'session-456',
 *   action: AdminActionType.UNLOCK_PROJECT,
 *   targetType: AdminTargetType.PROJECT,
 *   targetId: 'proj-789',
 *   beforeState: { status: 'SUSPENDED' },
 *   afterState: { status: 'ACTIVE' },
 *   metadata: { reason: 'False positive verified with customer' },
 * });
 * ```
 */
export async function logBreakGlassAction(
  params: BreakGlassAuditParams
): Promise<AdminAction> {
  const {
    adminId,
    sessionId,
    action,
    targetType,
    targetId,
    beforeState,
    afterState,
    metadata = {},
    ipAddress,
    userAgent,
    projectId,
    developerId,
  } = params;

  // Step 1: Log to admin_actions table
  const adminAction = await insertAdminAction(
    sessionId,
    action,
    targetType,
    targetId,
    beforeState,
    afterState
  );

  // Step 2: Log to audit_logs table (standard platform audit trail)
  // This ensures break glass actions appear in the main audit log
  await logAuditEntry({
    log_type: getAuditLogType(targetType),
    severity: getSeverityLevel(action),
    project_id: projectId || (targetType === AdminTargetType.PROJECT ? targetId : undefined),
    developer_id: developerId || adminId,
    action: getActionDescription(action),
    details: {
      admin_id: adminId,
      session_id: sessionId,
      break_glass_action: action,
      target_type: targetType,
      target_id: targetId,
      before_state: beforeState,
      after_state: afterState,
      admin_action_id: adminAction.id,
      ...metadata,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
    occurred_at: new Date(),
  });

  // Step 3: Send email notification about the action
  await sendActionNotification(params, adminAction);

  return adminAction;
}
