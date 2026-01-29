/**
 * Unlock Project Service
 *
 * Service layer for the unlock project break glass power.
 * Handles the business logic for unlocking suspended projects with full audit logging.
 *
 * US-004: Implement Unlock Project Power - Step 1: Foundation
 *
 * @example
 * ```typescript
 * import { unlockProject } from '@/features/break-glass/lib/unlock-project.service';
 *
 * const result = await unlockProject({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'False positive - verified with customer',
 * });
 *
 * console.log('Unlocked:', result.project.status);
 * ```
 */

import { getPool } from '@/lib/db';
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer';
import { logAdminAction, AdminActionType } from '@nextmavens/audit-logs-database';
import type {
  UnlockedProjectState,
  UnlockActionLog,
  UnlockProjectResponse,
  UnlockProjectError,
} from '../types/unlock-project.types';

/**
 * Unlock project operation parameters
 */
export interface UnlockProjectParams {
  /** Project ID to unlock */
  projectId: string;

  /** Break glass session ID */
  sessionId: string;

  /** Admin ID performing the unlock */
  adminId: string;

  /** Optional reason/context for the unlock */
  reason?: string;

  /** Whether to clear suspension flags (default: true) */
  clearSuspensionFlags?: boolean;
}

/**
 * Unlock a suspended project using break glass power
 *
 * This operation:
 * 1. Validates the project exists
 * 2. Captures the current state (before)
 * 3. Clears suspension flags if requested
 * 4. Sets project status to ACTIVE
 * 5. Logs the action with before/after states
 *
 * @param params - Unlock operation parameters
 * @returns Result of the unlock operation
 * @throws Error if project not found or database operation fails
 *
 * @example
 * ```typescript
 * const result = await unlockProject({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Customer verified legitimate usage',
 * });
 * ```
 */
export async function unlockProject(
  params: UnlockProjectParams
): Promise<UnlockProjectResponse> {
  const { projectId, sessionId, adminId, reason, clearSuspensionFlags = true } = params;

  const pool = getPool();

  // Step 1: Get current project state
  const projectResult = await pool.query(
    `
    SELECT
      p.id,
      p.project_name,
      p.status,
      p.tenant_id,
      p.developer_id,
      p.created_at
    FROM projects p
    WHERE p.id = $1
    `,
    [projectId]
  );

  if (projectResult.rows.length === 0) {
    const error: UnlockProjectError = {
      error: 'Project not found',
      details: `Project with ID ${projectId} does not exist`,
      code: 'PROJECT_NOT_FOUND',
    };
    throw new Error(JSON.stringify(error));
  }

  const project = projectResult.rows[0];

  // Step 2: Get current suspension state
  const suspension = await SuspensionManager.getStatus(projectId);

  // Capture before state
  const beforeState: Record<string, unknown> = {
    project_id: project.id,
    project_name: project.project_name,
    status: project.status,
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    suspension: suspension
      ? {
          suspended: true,
          cap_exceeded: suspension.cap_exceeded,
          reason: suspension.reason,
          suspended_at: suspension.suspended_at,
          notes: suspension.notes,
        }
      : {
          suspended: false,
        },
  };

  // Step 3: Clear suspension flags if requested
  let clearedSuspension = false;
  if (clearSuspensionFlags && suspension) {
    await SuspensionManager.unsuspend(projectId, 'Break glass unlock operation');
    clearedSuspension = true;
  }

  // Step 4: Update project status to ACTIVE
  const updateResult = await pool.query(
    `
    UPDATE projects
    SET status = 'ACTIVE',
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, project_name, status, updated_at
    `,
    [projectId]
  );

  const updatedProject = updateResult.rows[0];

  // Capture after state
  const afterState: Record<string, unknown> = {
    project_id: updatedProject.id,
    project_name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: project.status,
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    suspension_cleared: clearedSuspension,
    unlocked_at: updatedProject.updated_at,
    admin_reason: reason || null,
  };

  // Step 5: Log the admin action
  const action = await logAdminAction({
    session_id: sessionId,
    action: AdminActionType.UNLOCK_PROJECT,
    target_type: 'project',
    target_id: projectId,
    before_state: beforeState,
    after_state: afterState,
  });

  // Step 6: Build response
  const unlockedProject: UnlockedProjectState = {
    id: updatedProject.id,
    name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: project.status,
    unlocked_at: updatedProject.updated_at,
  };

  if (suspension) {
    unlockedProject.previous_suspension = {
      cap_exceeded: suspension.cap_exceeded,
      reason: suspension.reason.cap_type || suspension.reason.details || 'Unknown',
      suspended_at: suspension.suspended_at,
      notes: suspension.notes || null,
    };
  }

  const actionLog: UnlockActionLog = {
    id: action.id,
    session_id: action.session_id,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id as string,
    before_state: action.before_state as Record<string, unknown>,
    after_state: action.after_state as Record<string, unknown>,
    logged_at: action.created_at,
  };

  const response: UnlockProjectResponse = {
    success: true,
    project: unlockedProject,
    action_log: actionLog,
  };

  // Add warning if project was already active
  if (project.status === 'ACTIVE' && !suspension) {
    response.warning = 'Project was already ACTIVE and had no suspension';
  }

  return response;
}

/**
 * Get unlock operation history for a project
 *
 * @param projectId - Project ID to query
 * @returns Array of unlock actions performed on this project
 *
 * @example
 * ```typescript
 * const history = await getUnlockHistory('proj-123');
 * console.log('Unlock operations:', history.length);
 * ```
 */
export async function getUnlockHistory(projectId: string): Promise<UnlockActionLog[]> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.before_state,
      aa.after_state,
      aa.created_at
    FROM control_plane.admin_actions aa
    WHERE aa.action = $1
      AND aa.target_type = 'project'
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
    `,
    [AdminActionType.UNLOCK_PROJECT, projectId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    before_state: row.before_state as Record<string, unknown>,
    after_state: row.after_state as Record<string, unknown>,
    logged_at: row.created_at,
  }));
}

/**
 * Validate unlock request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const validation = validateUnlockRequest({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 * });
 *
 * if (!validation.valid) {
 *   return NextResponse.json(
 *     { errors: validation.errors },
 *     { status: 400 }
 *   );
 * }
 * ```
 */
export function validateUnlockRequest(
  params: Partial<UnlockProjectParams>
): { valid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (!params.projectId || typeof params.projectId !== 'string') {
    errors.push({ field: 'projectId', message: 'Project ID is required and must be a string' });
  }

  if (!params.sessionId || typeof params.sessionId !== 'string') {
    errors.push({ field: 'sessionId', message: 'Session ID is required and must be a string' });
  }

  if (!params.adminId || typeof params.adminId !== 'string') {
    errors.push({ field: 'adminId', message: 'Admin ID is required and must be a string' });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
