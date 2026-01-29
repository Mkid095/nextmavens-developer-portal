/**
 * Access Project Service
 *
 * Service layer for the access project break glass power.
 * Allows platform operators to access ANY project details, bypassing normal
 * ownership checks for investigation purposes.
 *
 * US-008: Implement Access Any Project Power
 *
 * @example
 * ```typescript
 * import { accessProject } from '@/features/break-glass/lib/access-project.service';
 *
 * const result = await accessProject({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 * });
 *
 * console.log('Project owner:', result.project.developer_id);
 * ```
 */

import { getPool } from '@/lib/db';
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer';
import {
  AdminActionType,
  AdminTargetType,
  type AdminAction,
} from './admin-database';
import { logBreakGlassAction } from './aggressive-audit-logger';
import type {
  FullProjectDetails,
  AccessProjectResponse,
  ProjectAccessLog,
  AccessHistoryEntry,
  SuspensionDetails,
  HardCapsConfig,
} from '../types/access-project.types';

/**
 * Access project operation parameters
 */
export interface AccessProjectParams {
  /** Project ID to access */
  projectId: string;

  /** Break glass session ID */
  sessionId: string;

  /** Admin ID performing the access */
  adminId: string;

  /** Optional IP address of admin */
  ipAddress?: string;

  /** Optional user agent of admin */
  userAgent?: string;
}

/**
 * Access a project using break glass power (bypasses ownership checks)
 *
 * This operation:
 * 1. Retrieves the project without ownership checks
 * 2. Gets suspension status if applicable
 * 3. Gets hard caps configuration
 * 4. Gets API keys and service accounts counts
 * 5. Logs the access with full context
 *
 * This is a READ-ONLY operation - no modifications are made to the project.
 *
 * @param params - Access operation parameters
 * @returns Full project details with access log
 * @throws Error if project not found or database operation fails
 *
 * @example
 * ```typescript
 * const result = await accessProject({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 * });
 * ```
 */
export async function accessProject(
  params: AccessProjectParams
): Promise<AccessProjectResponse> {
  const { projectId, sessionId, adminId, ipAddress, userAgent } = params;

  const pool = getPool();

  // Step 1: Get project details WITHOUT ownership check (bypass normal security)
  const projectResult = await pool.query(
    `
    SELECT
      p.id,
      p.project_name,
      p.tenant_id,
      p.developer_id,
      p.status,
      p.webhook_url,
      p.allowed_origins,
      p.rate_limit,
      p.environment,
      p.created_at,
      p.updated_at,
      t.slug as tenant_slug
    FROM projects p
    JOIN tenants t ON p.tenant_id = t.id
    WHERE p.id = $1
    `,
    [projectId]
  );

  if (projectResult.rows.length === 0) {
    const error = {
      error: 'Project not found',
      details: `Project with ID ${projectId} does not exist`,
      code: 'PROJECT_NOT_FOUND',
    };
    throw new Error(JSON.stringify(error));
  }

  const project = projectResult.rows[0];

  // Step 2: Get suspension status
  const suspension = await SuspensionManager.getStatus(projectId);

  // Step 3: Get hard caps configuration
  const capsResult = await pool.query(
    `
    SELECT
      db_queries_per_day,
      realtime_connections,
      storage_uploads_per_day,
      function_invocations_per_day
    FROM control_plane.quotas
    WHERE project_id = $1
    `,
    [projectId]
  );

  const hardCaps = capsResult.rows[0];

  // Step 4: Get API keys count
  const keysCountResult = await pool.query(
    `
    SELECT COUNT(*) as count
    FROM api_keys
    WHERE project_id = $1
    `,
    [projectId]
  );

  // Step 5: Get service accounts count
  const serviceAccountsCountResult = await pool.query(
    `
    SELECT COUNT(*) as count
    FROM service_accounts
    WHERE project_id = $1
    `,
    [projectId]
  );

  // Build full project details
  const projectDetails: FullProjectDetails = {
    id: project.id,
    name: project.project_name,
    tenant_id: project.tenant_id,
    tenant_slug: project.tenant_slug,
    developer_id: project.developer_id,
    status: project.status,
    webhook_url: project.webhook_url,
    allowed_origins: project.allowed_origins || [],
    rate_limit: project.rate_limit,
    environment: project.environment,
    created_at: project.created_at,
    updated_at: project.updated_at,
    api_keys_count: parseInt(keysCountResult.rows[0].count),
    service_accounts_count: parseInt(serviceAccountsCountResult.rows[0].count),
  };

  // Add suspension details if suspended
  if (suspension) {
    const suspensionDetails: SuspensionDetails = {
      suspended: true,
      cap_exceeded: suspension.cap_exceeded,
      reason: suspension.reason?.cap_type || suspension.reason?.details || 'Unknown',
      suspended_at: suspension.suspended_at,
      notes: suspension.notes,
    };
    projectDetails.suspension = suspensionDetails;
  } else {
    projectDetails.suspension = {
      suspended: false,
    };
  }

  // Add hard caps if available
  if (hardCaps) {
    const capsConfig: HardCapsConfig = {
      db_queries_per_day: hardCaps.db_queries_per_day,
      realtime_connections: hardCaps.realtime_connections,
      storage_uploads_per_day: hardCaps.storage_uploads_per_day,
      function_invocations_per_day: hardCaps.function_invocations_per_day,
    };
    projectDetails.hard_caps = capsConfig;
  }

  // Capture state for audit logging (same before and after since read-only)
  const stateSnapshot = {
    project_id: project.id,
    project_name: project.project_name,
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    status: project.status,
    environment: project.environment,
    suspension: projectDetails.suspension,
    hard_caps: projectDetails.hard_caps,
    api_keys_count: projectDetails.api_keys_count,
    service_accounts_count: projectDetails.service_accounts_count,
    webhook_url: project.webhook_url,
    allowed_origins: project.allowed_origins,
    rate_limit: project.rate_limit,
  };

  // Step 6: Log the access with aggressive audit logging
  const action = await logBreakGlassAction({
    adminId,
    sessionId,
    action: AdminActionType.ACCESS_PROJECT,
    targetType: AdminTargetType.PROJECT,
    targetId: projectId,
    beforeState: stateSnapshot,
    afterState: stateSnapshot, // Same - read-only operation
    metadata: {
      access_type: 'read_only',
      project_name: project.project_name,
      developer_id: project.developer_id,
      tenant_id: project.tenant_id,
      status: project.status,
    },
    projectId,
    developerId: project.developer_id,
    ipAddress,
    userAgent,
  });

  // Step 7: Get session details for response
  const sessionResult = await pool.query(
    `
    SELECT
      id,
      admin_id,
      reason,
      access_method,
      expires_at
    FROM control_plane.admin_sessions
    WHERE id = $1
    `,
    [sessionId]
  );

  const session = sessionResult.rows[0];

  // Build access log
  const accessLog: ProjectAccessLog = {
    id: action.id,
    session_id: action.session_id,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id as string,
    before_state: action.before_state as Record<string, unknown>,
    after_state: action.after_state as Record<string, unknown>,
    logged_at: action.created_at,
  };

  // Build response
  const response: AccessProjectResponse = {
    success: true,
    project: projectDetails,
    access_log: accessLog,
    session: {
      id: session.id,
      admin_id: session.admin_id,
      reason: session.reason,
      access_method: session.access_method,
      expires_at: session.expires_at,
    },
  };

  return response;
}

/**
 * Get access history for a project
 *
 * @param projectId - Project ID to query
 * @returns Array of access history entries
 *
 * @example
 * ```typescript
 * const history = await getAccessHistory('proj-123');
 * console.log('Project accessed:', history.length, 'times via break glass');
 * ```
 */
export async function getAccessHistory(projectId: string): Promise<AccessHistoryEntry[]> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      aa.id,
      aa.session_id,
      s.admin_id,
      s.reason as session_reason,
      aa.created_at as accessed_at,
      (SELECT details->>'ip_address' FROM audit_logs WHERE (details->>'admin_action_id') = aa.id LIMIT 1) as ip_address,
      (SELECT details->>'user_agent' FROM audit_logs WHERE (details->>'admin_action_id') = aa.id LIMIT 1) as user_agent
    FROM control_plane.admin_actions aa
    JOIN control_plane.admin_sessions s ON s.id = aa.session_id
    WHERE aa.action = $1
      AND aa.target_type = 'project'
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
    `,
    [AdminActionType.ACCESS_PROJECT, projectId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    admin_id: row.admin_id,
    session_reason: row.session_reason,
    accessed_at: row.accessed_at,
    ip_address: row.ip_address || undefined,
    user_agent: row.user_agent || undefined,
  }));
}

/**
 * Validate access request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const validation = validateAccessRequest({
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
export function validateAccessRequest(
  params: Partial<AccessProjectParams>
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
