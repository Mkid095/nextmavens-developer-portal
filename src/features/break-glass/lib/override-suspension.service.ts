/**
 * Override Suspension Service
 *
 * Service layer for the override suspension break glass power.
 * Handles the business logic for overriding auto-suspension and
 * increasing hard caps for legitimate high-usage projects.
 *
 * US-005: Implement Override Suspension Power - Step 1: Foundation
 *
 * @example
 * ```typescript
 * import { overrideSuspension } from '@/features/break-glass/lib/override-suspension.service';
 *
 * const result = await overrideSuspension({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Legitimate high-usage project - verified with customer',
 *   newHardCaps: [{ type: 'db_queries_per_day', value: 50000 }],
 * });
 *
 * console.log('Overridden:', result.project.status);
 * ```
 */

import { getPool } from '@/lib/db';
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer';
import { QuotaManager } from '@/features/abuse-controls/lib/data-layer';
import {
  logAdminAction,
  AdminActionType,
  AdminTargetType,
} from './admin-database';
import type {
  OverrideProjectState,
  OverrideActionLog,
  OverrideSuspensionResponse,
  OverrideSuspensionError,
} from '../types/override-suspension.types';
import { HardCapType } from '@/features/abuse-controls/types';

/**
 * Hard cap update record
 */
interface HardCapUpdate {
  type: string;
  previous_value: number;
  new_value: number;
}

/**
 * Override suspension operation parameters
 */
export interface OverrideSuspensionParams {
  /** Project ID to override */
  projectId: string;

  /** Break glass session ID */
  sessionId: string;

  /** Admin ID performing the override */
  adminId: string;

  /** Optional reason/context for the override */
  reason?: string;

  /** Whether to clear suspension flags (default: true) */
  clearSuspensionFlags?: boolean;

  /** Optional new hard caps to set */
  newHardCaps?: Array<{ type: string; value: number }>;

  /** Optional percentage to increase all existing caps */
  increaseCapsByPercent?: number;
}

/**
 * Override a suspended project's suspension and optionally increase hard caps
 *
 * This operation:
 * 1. Validates the project exists
 * 2. Captures the current state (before)
 * 3. Clears suspension flags if requested
 * 4. Optionally increases hard caps
 * 5. Logs the action with before/after states
 *
 * @param params - Override operation parameters
 * @returns Result of the override operation
 * @throws Error if project not found or database operation fails
 *
 * @example
 * ```typescript
 * const result = await overrideSuspension({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Customer verified legitimate usage',
 *   newHardCaps: [
 *     { type: 'db_queries_per_day', value: 50000 },
 *     { type: 'storage_uploads_per_day', value: 5000 },
 *   ],
 * });
 * ```
 */
export async function overrideSuspension(
  params: OverrideSuspensionParams
): Promise<OverrideSuspensionResponse> {
  const {
    projectId,
    sessionId,
    adminId,
    reason,
    clearSuspensionFlags = true,
    newHardCaps,
    increaseCapsByPercent,
  } = params;

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
    const error: OverrideSuspensionError = {
      error: 'Project not found',
      details: `Project with ID ${projectId} does not exist`,
      code: 'PROJECT_NOT_FOUND',
    };
    throw new Error(JSON.stringify(error));
  }

  const project = projectResult.rows[0];

  // Step 2: Get current suspension state
  const suspension = await SuspensionManager.getStatus(projectId);

  // Step 3: Get current quotas
  const currentQuotas = await QuotaManager.getQuotas(projectId);
  const quotaMap = new Map(currentQuotas.map((q) => [q.cap_type, q.cap_value]));

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
    quotas: Object.fromEntries(quotaMap),
  };

  // Step 4: Clear suspension flags if requested
  let clearedSuspension = false;
  if (clearSuspensionFlags && suspension) {
    await SuspensionManager.unsuspend(
      projectId,
      'Break glass override suspension operation'
    );
    clearedSuspension = true;
  }

  // Step 5: Update hard caps if requested
  const capUpdates: HardCapUpdate[] = [];
  let capsUpdated = false;

  if (newHardCaps && newHardCaps.length > 0) {
    for (const cap of newHardCaps) {
      const previousValue = quotaMap.get(cap.type);
      if (previousValue === undefined) {
        // New cap - set it
        await QuotaManager.updateQuota(
          projectId,
          cap.type as HardCapType,
          cap.value
        );
        capUpdates.push({
          type: cap.type,
          previous_value: 0,
          new_value: cap.value,
        });
      } else {
        // Existing cap - update it
        await QuotaManager.updateQuota(
          projectId,
          cap.type as HardCapType,
          cap.value
        );
        capUpdates.push({
          type: cap.type,
          previous_value: previousValue,
          new_value: cap.value,
        });
      }
    }
    capsUpdated = capUpdates.length > 0;
  } else if (increaseCapsByPercent && increaseCapsByPercent > 0) {
    // Increase all existing caps by percentage
    const multiplier = 1 + increaseCapsByPercent / 100;
    for (const [capType, currentValue] of quotaMap.entries()) {
      const newValue = Math.floor(currentValue * multiplier);
      await QuotaManager.updateQuota(
        projectId,
        capType as HardCapType,
        newValue
      );
      capUpdates.push({
        type: capType,
        previous_value: currentValue,
        new_value: newValue,
      });
    }
    capsUpdated = capUpdates.length > 0;
  }

  // Step 6: Update project status to ACTIVE (if it was suspended)
  let updatedProject = project;
  if (project.status !== 'ACTIVE') {
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
    updatedProject = updateResult.rows[0];
  }

  // Capture after state
  const afterState: Record<string, unknown> = {
    project_id: updatedProject.id,
    project_name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: project.status,
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    suspension_cleared: clearedSuspension,
    caps_updated: capsUpdated,
    cap_updates: capUpdates,
    overridden_at: updatedProject.updated_at || new Date(),
    admin_reason: reason || null,
  };

  // Step 7: Log the admin action
  const action = await logAdminAction({
    session_id: sessionId,
    action: AdminActionType.OVERRIDE_SUSPENSION,
    target_type: AdminTargetType.PROJECT,
    target_id: projectId,
    before_state: beforeState,
    after_state: afterState,
  });

  // Step 8: Build response
  const overriddenProject: OverrideProjectState = {
    id: updatedProject.id,
    name: updatedProject.project_name,
    status: updatedProject.status,
    previous_status: project.status,
    overridden_at: updatedProject.updated_at || new Date(),
    suspension_cleared: clearedSuspension,
  };

  if (suspension) {
    overriddenProject.previous_suspension = {
      cap_exceeded: suspension.cap_exceeded,
      reason:
        (suspension.reason as any).cap_type ||
        (suspension.reason as any).details ||
        'Unknown',
      suspended_at: suspension.suspended_at,
      notes: suspension.notes || null,
    };
  }

  if (capsUpdated && capUpdates.length > 0) {
    overriddenProject.caps_updated = true;
    overriddenProject.new_caps = capUpdates;
  }

  const actionLog: OverrideActionLog = {
    id: action.id,
    session_id: action.session_id,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id as string,
    before_state: action.before_state as Record<string, unknown>,
    after_state: action.after_state as Record<string, unknown>,
    logged_at: action.created_at,
  };

  const response: OverrideSuspensionResponse = {
    success: true,
    project: overriddenProject,
    action_log: actionLog,
  };

  // Add warning if project was already active and had no suspension
  if (project.status === 'ACTIVE' && !suspension && !capsUpdated) {
    response.warning =
      'Project was already ACTIVE, had no suspension, and no caps were updated';
  } else if (!clearedSuspension && !capsUpdated) {
    response.warning =
      'No suspension was cleared and no caps were updated (no changes made)';
  }

  return response;
}

/**
 * Get override suspension history for a project
 *
 * @param projectId - Project ID to query
 * @returns Array of override actions performed on this project
 *
 * @example
 * ```typescript
 * const history = await getOverrideHistory('proj-123');
 * console.log('Override operations:', history.length);
 * ```
 */
export async function getOverrideHistory(
  projectId: string
): Promise<OverrideActionLog[]> {
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
    [AdminActionType.OVERRIDE_SUSPENSION, projectId]
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
 * Validate override suspension request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const validation = validateOverrideRequest({
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
export function validateOverrideRequest(
  params: Partial<OverrideSuspensionParams>
): { valid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (!params.projectId || typeof params.projectId !== 'string') {
    errors.push({
      field: 'projectId',
      message: 'Project ID is required and must be a string',
    });
  }

  if (!params.sessionId || typeof params.sessionId !== 'string') {
    errors.push({
      field: 'sessionId',
      message: 'Session ID is required and must be a string',
    });
  }

  if (!params.adminId || typeof params.adminId !== 'string') {
    errors.push({
      field: 'adminId',
      message: 'Admin ID is required and must be a string',
    });
  }

  // Validate new hard caps if provided
  if (params.newHardCaps && params.newHardCaps.length > 0) {
    for (const cap of params.newHardCaps) {
      if (!cap.type || typeof cap.type !== 'string') {
        errors.push({
          field: 'newHardCaps',
          message: 'Each hard cap must have a valid type',
        });
      }
      if (typeof cap.value !== 'number' || cap.value <= 0) {
        errors.push({
          field: 'newHardCaps',
          message: 'Each hard cap must have a positive numeric value',
        });
      }
    }
  }

  // Validate percentage increase if provided
  if (
    params.increaseCapsByPercent !== undefined &&
    (typeof params.increaseCapsByPercent !== 'number' ||
      params.increaseCapsByPercent <= 0)
  ) {
    errors.push({
      field: 'increaseCapsByPercent',
      message: 'Percentage increase must be a positive number',
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
