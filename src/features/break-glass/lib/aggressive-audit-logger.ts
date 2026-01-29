/**
 * Aggressive Audit Logger for Break Glass Mode
 *
 * Ensures ALL break glass actions are aggressively logged to both:
 * 1. admin_actions table (break glass specific)
 * 2. audit_logs table (standard platform audit trail)
 *
 * This creates a complete, searchable audit trail of all emergency access.
 *
 * US-011: Implement Aggressive Audit Logging
 *
 * @example
 * ```typescript
 * import { logBreakGlassAction } from '@/features/break-glass/lib/aggressive-audit-logger';
 *
 * await logBreakGlassAction({
 *   adminId: 'admin-123',
 *   sessionId: 'session-456',
 *   action: AdminActionType.UNLOCK_PROJECT,
 *   targetType: AdminTargetType.PROJECT,
 *   targetId: 'proj-789',
 *   beforeState: { status: 'SUSPENDED' },
 *   afterState: { status: 'ACTIVE' },
 *   metadata: { reason: 'False positive verified' },
 * });
 * ```
 */

import { getPool } from '@/lib/db';
import {
  AdminActionType,
  AdminTargetType,
  type AdminSession,
  type AdminAction,
} from './admin-database';
import { AuditLogType, AuditLogLevel, logAuditEntry } from '@/features/abuse-controls/lib/audit-logger';
import { sendBreakGlassActionNotification } from './notifications';

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

/**
 * Map AdminActionType to human-readable action description
 */
function getActionDescription(action: AdminActionType): string {
  const descriptions: Record<AdminActionType, string> = {
    [AdminActionType.UNLOCK_PROJECT]: 'Break Glass: Unlocked suspended project',
    [AdminActionType.OVERRIDE_SUSPENSION]: 'Break Glass: Overrode auto-suspension',
    [AdminActionType.FORCE_DELETE]: 'Break Glass: Force deleted project',
    [AdminActionType.REGENERATE_KEYS]: 'Break Glass: Regenerated system keys',
    [AdminActionType.ACCESS_PROJECT]: 'Break Glass: Accessed project details',
    [AdminActionType.OVERRIDE_QUOTA]: 'Break Glass: Overrode quota limit',
    [AdminActionType.EMERGENCY_ACTION]: 'Break Glass: Emergency action performed',
  };
  return descriptions[action] || `Break Glass: ${action}`;
}

/**
 * Map AdminTargetType to audit log category
 */
function getAuditLogType(targetType: AdminTargetType): AuditLogType {
  // Map break glass targets to appropriate audit log types
  const mapping: Partial<Record<AdminTargetType, AuditLogType>> = {
    [AdminTargetType.PROJECT]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.API_KEY]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.DEVELOPER]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.SUSPENSION]: AuditLogType.UNSUSPENSION,
    [AdminTargetType.QUOTA]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.SYSTEM]: AuditLogType.MANUAL_INTERVENTION,
  };
  return mapping[targetType] || AuditLogType.MANUAL_INTERVENTION;
}

/**
 * Get severity level based on action type
 */
function getSeverityLevel(action: AdminActionType): AuditLogLevel {
  // Critical actions that bypass security
  if (
    action === AdminActionType.FORCE_DELETE ||
    action === AdminActionType.REGENERATE_KEYS ||
    action === AdminActionType.EMERGENCY_ACTION
  ) {
    return AuditLogLevel.CRITICAL;
  }

  // Important but less critical actions
  if (
    action === AdminActionType.UNLOCK_PROJECT ||
    action === AdminActionType.OVERRIDE_SUSPENSION ||
    action === AdminActionType.OVERRIDE_QUOTA
  ) {
    return AuditLogLevel.WARNING;
  }

  // Read-only actions
  return AuditLogLevel.INFO;
}

/**
 * Aggressively log a break glass action to BOTH audit trails
 *
 * This function:
 * 1. Logs to admin_actions table (break glass specific)
 * 2. Logs to audit_logs table (standard platform audit)
 * 3. Includes full context: admin, session, action, target, before/after states
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

  const pool = getPool();

  // Step 1: Log to admin_actions table
  const adminActionResult = await pool.query(
    `
    INSERT INTO control_plane.admin_actions (
      session_id,
      action,
      target_type,
      target_id,
      before_state,
      after_state
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [sessionId, action, targetType, targetId, JSON.stringify(beforeState), JSON.stringify(afterState)]
  );

  const adminAction = adminActionResult.rows[0] as AdminAction;

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
  // First, get the session details to include admin email and reason
  try {
    const sessionResult = await pool.query(
      `
      SELECT
        s.admin_id,
        s.reason,
        d.email
      FROM control_plane.admin_sessions s
      LEFT JOIN developers d ON d.id = s.admin_id
      WHERE s.id = $1
      `,
      [sessionId]
    );

    if (sessionResult.rows.length > 0) {
      const sessionRow = sessionResult.rows[0];
      await sendBreakGlassActionNotification({
        adminEmail: sessionRow.email || 'unknown@example.com',
        adminId: adminId,
        sessionId: sessionId,
        sessionReason: sessionRow.reason || 'No reason provided',
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

  return adminAction;
}

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
  const { adminId, sessionId, targetId, targetType, action, limit = 50, offset = 0 } = filters;

  const pool = getPool();

  // Build query conditions
  const conditions: string[] = [];
  const queryParams: (string | number)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`s.admin_id = $${paramIndex++}`);
    queryParams.push(adminId);
  }

  if (sessionId) {
    conditions.push(`aa.session_id = $${paramIndex++}`);
    queryParams.push(sessionId);
  }

  if (targetId) {
    conditions.push(`aa.target_id = $${paramIndex++}`);
    queryParams.push(targetId);
  }

  if (targetType) {
    conditions.push(`aa.target_type = $${paramIndex++}`);
    queryParams.push(targetType);
  }

  if (action) {
    conditions.push(`aa.action = $${paramIndex++}`);
    queryParams.push(action);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Query admin_actions with session details
  const query = `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.before_state,
      aa.after_state,
      aa.created_at,
      s.id as session_id,
      s.admin_id,
      s.reason as session_reason,
      s.access_method,
      s.granted_by,
      s.expires_at,
      s.created_at as session_created_at
    FROM control_plane.admin_actions aa
    JOIN control_plane.admin_sessions s ON s.id = aa.session_id
    ${whereClause}
    ORDER BY aa.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  return result.rows.map((row) => ({
    adminAction: {
      id: row.id,
      session_id: row.session_id,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id,
      before_state: row.before_state,
      after_state: row.after_state,
      created_at: row.created_at,
    },
    adminSession: {
      id: row.session_id,
      admin_id: row.admin_id,
      reason: row.session_reason,
      access_method: row.access_method,
      granted_by: row.granted_by,
      expires_at: row.expires_at,
      created_at: row.session_created_at,
    },
  }));
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
  const { adminId, sessionId, projectId, action, limit = 50, offset = 0 } = filters;

  const pool = getPool();

  // Build query conditions - filter for break glass actions in details
  const conditions: string[] = ["(details->>'break_glass_action') IS NOT NULL"];
  const queryParams: (string | number)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`(details->>'admin_id') = $${paramIndex++}`);
    queryParams.push(adminId);
  }

  if (sessionId) {
    conditions.push(`(details->>'session_id') = $${paramIndex++}`);
    queryParams.push(sessionId);
  }

  if (projectId) {
    conditions.push(`project_id = $${paramIndex++}`);
    queryParams.push(projectId);
  }

  if (action) {
    conditions.push(`(details->>'break_glass_action') = $${paramIndex++}`);
    queryParams.push(action);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const query = `
    SELECT
      id,
      log_type,
      severity,
      project_id,
      developer_id,
      action,
      details,
      ip_address,
      user_agent,
      occurred_at
    FROM audit_logs
    ${whereClause}
    ORDER BY occurred_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  return result.rows as BreakGlassAuditEntry[];
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
  const pool = getPool();

  // Get session
  const sessionResult = await pool.query(
    `
    SELECT
      id,
      admin_id,
      reason,
      access_method,
      granted_by,
      expires_at,
      created_at
    FROM control_plane.admin_sessions
    WHERE id = $1
    `,
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const adminSession = sessionResult.rows[0] as AdminSession;

  // Get all actions for this session
  const actionsResult = await pool.query(
    `
    SELECT
      id,
      session_id,
      action,
      target_type,
      target_id,
      before_state,
      after_state,
      created_at
    FROM control_plane.admin_actions
    WHERE session_id = $1
    ORDER BY created_at ASC
    `,
    [sessionId]
  );

  const actions = actionsResult.rows as AdminAction[];

  // Get audit logs for this session
  const auditResult = await pool.query(
    `
    SELECT
      id,
      log_type,
      severity,
      project_id,
      developer_id,
      action,
      details,
      ip_address,
      user_agent,
      occurred_at
    FROM audit_logs
    WHERE (details->>'session_id') = $1
    ORDER BY occurred_at ASC
    `,
    [sessionId]
  );

  const auditLogs = auditResult.rows as BreakGlassAuditEntry[];

  return {
    adminSession,
    actions,
    auditLogs,
  };
}

/**
 * Verify that an action has complete audit coverage
 *
 * Checks that an action exists in BOTH admin_actions AND audit_logs.
 * Used for audit compliance verification.
 *
 * @param adminActionId - Admin action ID to verify
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const verification = await verifyAuditCoverage('action-123');
 * if (!verification.complete) {
 *   console.error('Audit coverage incomplete:', verification.issues);
 * }
 * ```
 */
export async function verifyAuditCoverage(
  adminActionId: string
): Promise<{
  complete: boolean;
  adminAction: AdminAction | null;
  auditLog: BreakGlassAuditEntry | null;
  issues: string[];
}> {
  const pool = getPool();
  const issues: string[] = [];

  // Check admin_actions table
  const adminActionResult = await pool.query(
    `
    SELECT
      id,
      session_id,
      action,
      target_type,
      target_id,
      before_state,
      after_state,
      created_at
    FROM control_plane.admin_actions
    WHERE id = $1
    `,
    [adminActionId]
  );

  const adminAction = adminActionResult.rows[0] || null;

  if (!adminAction) {
    issues.push(`Admin action ${adminActionId} not found in admin_actions table`);
  }

  // Check audit_logs table
  const auditResult = await pool.query(
    `
    SELECT
      id,
      log_type,
      severity,
      project_id,
      developer_id,
      action,
      details,
      ip_address,
      user_agent,
      occurred_at
    FROM audit_logs
    WHERE (details->>'admin_action_id') = $1
    `,
    [adminActionId]
  );

  const auditLog = (auditResult.rows[0] || null) as BreakGlassAuditEntry | null;

  if (!auditLog) {
    issues.push(`Admin action ${adminActionId} not found in audit_logs table`);
  }

  // Verify details match
  if (adminAction && auditLog) {
    if (auditLog.details.session_id !== adminAction.session_id) {
      issues.push(`Session ID mismatch between admin_actions and audit_logs`);
    }
    if (auditLog.details.break_glass_action !== adminAction.action) {
      issues.push(`Action mismatch between admin_actions and audit_logs`);
    }
  }

  return {
    complete: issues.length === 0,
    adminAction,
    auditLog,
    issues,
  };
}

/**
 * Get audit coverage report for all break glass actions
 *
 * @param filters - Optional filters for the report
 * @returns Audit coverage report
 *
 * @example
 * ```typescript
 * const report = await getAuditCoverageReport({
 *   adminId: 'admin-123',
 *   startDate: new Date('2024-01-01'),
 * });
 * console.log(`Total actions: ${report.totalActions}`);
 * console.log(`Complete coverage: ${report.completeCoverage}`);
 * ```
 */
export async function getAuditCoverageReport(filters: {
  adminId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalActions: number;
  completeCoverage: number;
  incompleteActions: Array<{
    adminActionId: string;
    issues: string[];
  }>;
}> {
  const { adminId, sessionId, startDate, endDate } = filters;

  const pool = getPool();

  // Build query conditions
  const conditions: string[] = [];
  const queryParams: (string | Date)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`s.admin_id = $${paramIndex++}`);
    queryParams.push(adminId);
  }

  if (sessionId) {
    conditions.push(`aa.session_id = $${paramIndex++}`);
    queryParams.push(sessionId);
  }

  if (startDate) {
    conditions.push(`aa.created_at >= $${paramIndex++}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push(`aa.created_at <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get all admin actions
  const query = `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.created_at
    FROM control_plane.admin_actions aa
    JOIN control_plane.admin_sessions s ON s.id = aa.session_id
    ${whereClause}
    ORDER BY aa.created_at DESC
  `;

  const result = await pool.query(query, queryParams);

  const incompleteActions: Array<{
    adminActionId: string;
    issues: string[];
  }> = [];
  let completeCoverage = 0;

  // Verify each action
  for (const row of result.rows) {
    const verification = await verifyAuditCoverage(row.id);
    if (verification.complete) {
      completeCoverage++;
    } else {
      incompleteActions.push({
        adminActionId: row.id,
        issues: verification.issues,
      });
    }
  }

  return {
    totalActions: result.rows.length,
    completeCoverage,
    incompleteActions,
  };
}
