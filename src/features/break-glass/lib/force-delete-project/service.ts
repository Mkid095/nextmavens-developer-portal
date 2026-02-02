/**
 * Force Delete Project Service - Main Service
 *
 * Service layer for the force delete project break glass power.
 * Handles the business logic for immediately deleting projects with full audit logging.
 *
 * US-006: Implement Force Delete Power - Step 1: Foundation
 */

import { getPool } from '@/lib/db'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import { AdminActionType, AdminTargetType } from '../admin-database/types'
import { logBreakGlassAction } from '../aggressive-audit-logger'
import { invalidateSnapshot } from '@/lib/snapshot'
import type {
  ForceDeleteProjectParams,
  DeletedProjectState,
  ForceDeleteActionLog,
  ForceDeleteProjectResponse,
  CleanupResources,
} from './types'
import type { ForceDeleteProjectError } from '../../types/force-delete-project.types'

/**
 * Force delete a project immediately using break glass power
 *
 * This operation:
 * 1. Validates the project exists
 * 2. Captures the current state (before)
 * 3. Deletes the project immediately (no grace period)
 * 4. Cleans up all associated resources if requested
 * 5. Logs the action with before/after states
 *
 * @param params - Force delete operation parameters
 * @returns Result of the force delete operation
 * @throws Error if project not found or database operation fails
 *
 * @example
 * ```typescript
 * const result = await forceDeleteProject({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Security incident - immediate removal required',
 * });
 * ```
 */
export async function forceDeleteProject(
  params: ForceDeleteProjectParams
): Promise<ForceDeleteProjectResponse> {
  const { projectId, sessionId, adminId, reason, cleanupResources = true } = params;

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
      p.environment,
      p.created_at
    FROM projects p
    WHERE p.id = $1
    `,
    [projectId]
  );

  if (projectResult.rows.length === 0) {
    const error: ForceDeleteProjectError = {
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
    environment: project.environment,
    created_at: project.created_at,
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

  // Step 3: Count resources before cleanup
  const resourcesCleaned: CleanupResources = {
    api_keys_deleted: 0,
    service_accounts_deleted: 0,
    webhooks_deleted: 0,
    suspension_cleared: false,
  };

  if (cleanupResources) {
    // Count and delete API keys
    const apiKeysResult = await pool.query(
      'SELECT COUNT(*) as count FROM api_keys WHERE project_id = $1',
      [projectId]
    );
    resourcesCleaned.api_keys_deleted = parseInt(apiKeysResult.rows[0].count, 10);

    await pool.query('DELETE FROM api_keys WHERE project_id = $1', [projectId]);

    // Count and delete service accounts (if table exists)
    try {
      const serviceAccountsResult = await pool.query(
        'SELECT COUNT(*) as count FROM service_accounts WHERE project_id = $1',
        [projectId]
      );
      resourcesCleaned.service_accounts_deleted = parseInt(
        serviceAccountsResult.rows[0].count,
        10
      );
      await pool.query('DELETE FROM service_accounts WHERE project_id = $1', [projectId]);
    } catch {
      // Table might not exist, continue
    }

    // Clear suspension if exists
    if (suspension) {
      await SuspensionManager.unsuspend(projectId, 'Force delete operation');
      resourcesCleaned.suspension_cleared = true;
    }

    // Delete webhook configurations (stored in project.webhook_url)
    resourcesCleaned.webhooks_deleted = project.webhook_url ? 1 : 0;
  }

  // Step 4: Delete the project immediately (no grace period)
  await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

  // Invalidate snapshot cache for this project
  invalidateSnapshot(projectId);

  // Capture after state
  const afterState: Record<string, unknown> = {
    project_id: project.id,
    project_name: project.project_name,
    previous_status: project.status,
    deleted_at: new Date().toISOString(),
    deletion_type: 'force_delete',
    cleanup_performed: cleanupResources,
    resources_cleaned: resourcesCleaned,
    admin_reason: reason || null,
  };

  // Step 5: Log the admin action to BOTH admin_actions AND audit_logs (aggressive logging)
  const action = await logBreakGlassAction({
    adminId,
    sessionId,
    action: AdminActionType.FORCE_DELETE,
    targetType: AdminTargetType.PROJECT,
    targetId: projectId,
    beforeState,
    afterState,
    metadata: {
      reason: reason || 'No reason provided',
      project_name: project.project_name,
      previous_status: project.status,
      cleanup_resources: cleanupResources,
      resources_cleaned: resourcesCleaned,
    },
    projectId,
    developerId: adminId,
  });

  // Step 6: Build response
  const deletedProject: DeletedProjectState = {
    id: project.id,
    name: project.project_name,
    status: 'DELETED',
    deleted_at: new Date(),
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    environment: project.environment || undefined,
    created_at: project.created_at,
  };

  const actionLog: ForceDeleteActionLog = {
    id: action.id,
    session_id: action.session_id,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id as string,
    before_state: action.before_state as Record<string, unknown>,
    after_state: action.after_state as Record<string, unknown>,
    logged_at: action.created_at,
  };

  const response: ForceDeleteProjectResponse = {
    success: true,
    deleted_project: deletedProject,
    action_log: actionLog,
  };

  // Add resources cleaned if cleanup was performed
  if (cleanupResources) {
    response.resources_cleaned = resourcesCleaned;
  }

  return response;
}
