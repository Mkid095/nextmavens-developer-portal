/**
 * Access Project Service - Main Service
 *
 * Service layer for the access project break glass power.
 * Allows platform operators to access ANY project details, bypassing normal
 * ownership checks for investigation purposes.
 *
 * US-008: Implement Access Any Project Power
 */

import { getPool } from '@/lib/db'
import { SuspensionManager } from '@/features/abuse-controls/lib/data-layer'
import {
  AdminActionType,
  AdminTargetType,
} from '../admin-database/types'
import { logBreakGlassAction } from '../aggressive-audit-logger'
import type {
  AccessProjectParams,
  FullProjectDetails,
  AccessProjectResponse,
  ProjectAccessLog,
  SuspensionDetails,
  HardCapsConfig,
} from './types'
import type {
  SuspensionRecord,
} from '../../abuse-controls/types'

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
      cap_exceeded: (suspension as SuspensionRecord).cap_exceeded,
      reason: (suspension as SuspensionRecord).reason?.cap_type || (suspension as SuspensionRecord).reason?.details || 'Unknown',
      suspended_at: (suspension as SuspensionRecord).suspended_at,
      notes: (suspension as SuspensionRecord).notes,
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
