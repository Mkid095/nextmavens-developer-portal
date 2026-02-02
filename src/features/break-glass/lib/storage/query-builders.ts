/**
 * SQL Query Builders for Break Glass Audit Storage
 * Helper functions for building complex SQL queries with filters
 */

export interface QueryFilters {
  adminId?: string
  sessionId?: string
  targetId?: string
  targetType?: string
  action?: string
  projectId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface BuiltQuery {
  text: string
  params: (string | number | Date)[]
}

/**
 * Build WHERE clause conditions from filters
 */
export function buildWhereClause(
  conditions: string[],
  params: (string | number | Date)[]
): { whereClause: string; params: (string | number | Date)[] } {
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

/**
 * Build admin actions history query
 */
export function buildAdminActionsHistoryQuery(filters: QueryFilters): BuiltQuery {
  const { adminId, sessionId, targetId, targetType, action, limit = 50, offset = 0 } = filters;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`s.admin_id = $${paramIndex++}`);
    params.push(adminId);
  }

  if (sessionId) {
    conditions.push(`aa.session_id = $${paramIndex++}`);
    params.push(sessionId);
  }

  if (targetId) {
    conditions.push(`aa.target_id = $${paramIndex++}`);
    params.push(targetId);
  }

  if (targetType) {
    conditions.push(`aa.target_type = $${paramIndex++}`);
    params.push(targetType);
  }

  if (action) {
    conditions.push(`aa.action = $${paramIndex++}`);
    params.push(action);
  }

  const { whereClause, params: allParams } = buildWhereClause(conditions, params);

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

  allParams.push(limit, offset);

  return { text: query, params: allParams };
}

/**
 * Build audit logs query with break glass filters
 */
export function buildAuditLogsQuery(filters: Omit<QueryFilters, 'targetId' | 'targetType'>): BuiltQuery {
  const { adminId, sessionId, projectId, action, limit = 50, offset = 0 } = filters;

  const conditions: string[] = ["(details->>'break_glass_action') IS NOT NULL"];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`(details->>'admin_id') = $${paramIndex++}`);
    params.push(adminId);
  }

  if (sessionId) {
    conditions.push(`(details->>'session_id') = $${paramIndex++}`);
    params.push(sessionId);
  }

  if (projectId) {
    conditions.push(`project_id = $${paramIndex++}`);
    params.push(projectId);
  }

  if (action) {
    conditions.push(`(details->>'break_glass_action') = $${paramIndex++}`);
    params.push(action);
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

  params.push(limit, offset);

  return { text: query, params };
}

/**
 * Build admin actions for report query
 */
export function buildAdminActionsReportQuery(filters: Omit<QueryFilters, 'targetId' | 'targetType' | 'action' | 'limit' | 'offset'>): BuiltQuery {
  const { adminId, sessionId, startDate, endDate } = filters;

  const conditions: string[] = [];
  const params: (string | Date)[] = [];
  let paramIndex = 1;

  if (adminId) {
    conditions.push(`s.admin_id = $${paramIndex++}`);
    params.push(adminId);
  }

  if (sessionId) {
    conditions.push(`aa.session_id = $${paramIndex++}`);
    params.push(sessionId);
  }

  if (startDate) {
    conditions.push(`aa.created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`aa.created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const { whereClause, params: allParams } = buildWhereClause(conditions, params);

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

  return { text: query, params };
}
