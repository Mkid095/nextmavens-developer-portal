import { getPool } from '@/lib/db'

/**
 * Migration: Create audit_logs table for Audit Logs API
 *
 * This table stores audit log entries for all governance actions across the platform.
 * Per Invariant #4 and ADR-0003, all governance actions must be logged centrally
 * by the Control Plane API.
 *
 * Per PRD requirements:
 * - Columns: id, actor_id, actor_type, action, target_type, target_id, project_id,
 *            request_id, metadata, ip_address, user_agent, severity, created_at
 * - Actor types: user, system, api_key, project
 * - Target types: project, api_key, user, secret, organization, team, webhook
 * - Actions: project.*, key.*, user.*, secret.*, webhook.*, organization.*, quota.*, suspension.*
 * - Severity: info, warning, error, critical
 */
export async function createAuditLogsTable() {
  const pool = getPool()

  try {
    // Ensure control_plane schema exists
    await pool.query(`CREATE SCHEMA IF NOT EXISTS control_plane`)

    // Check if audit_logs table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'audit_logs'
        AND table_schema = 'control_plane'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create audit_logs table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          actor_id UUID,
          actor_type VARCHAR(50) NOT NULL,
          action VARCHAR(255) NOT NULL,
          target_type VARCHAR(100),
          target_id UUID,
          project_id UUID,
          request_id UUID,
          metadata JSONB DEFAULT '{}',
          ip_address INET,
          user_agent TEXT,
          severity VARCHAR(20) NOT NULL DEFAULT 'info',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT audit_logs_actor_type_check CHECK (actor_type IN (
            'user',
            'system',
            'api_key',
            'project'
          )),

          CONSTRAINT audit_logs_severity_check CHECK (severity IN (
            'info',
            'warning',
            'error',
            'critical'
          ))
        )
      `)

      console.log('[Migration] Created audit_logs table in control_plane schema')

      // Create indexes for efficient queries
      await pool.query(`
        CREATE INDEX idx_audit_logs_actor_id
        ON control_plane.audit_logs(actor_id)
        WHERE actor_id IS NOT NULL
      `)

      await pool.query(`
        CREATE INDEX idx_audit_logs_actor_type
        ON control_plane.audit_logs(actor_type)
      `)

      await pool.query(`
        CREATE INDEX idx_audit_logs_action
        ON control_plane.audit_logs(action)
      `)

      await pool.query(`
        CREATE INDEX idx_audit_logs_target
        ON control_plane.audit_logs(target_type, target_id)
        WHERE target_id IS NOT NULL
      `)

      await pool.query(`
        CREATE INDEX idx_audit_logs_project_id
        ON control_plane.audit_logs(project_id)
        WHERE project_id IS NOT NULL
      `)

      await pool.query(`
        CREATE INDEX idx_audit_logs_created_at
        ON control_plane.audit_logs(created_at DESC)
      `)

      await pool.query(`
        CREATE INDEX idx_audit_logs_severity
        ON control_plane.audit_logs(severity)
      `)

      await pool.query(`
        CREATE INDEX idx_audit_logs_request_id
        ON control_plane.audit_logs(request_id)
        WHERE request_id IS NOT NULL
      `)

      console.log('[Migration] Created indexes on audit_logs table')

      // Add table and column comments for documentation
      await pool.query(`
        COMMENT ON TABLE control_plane.audit_logs IS 'Audit log entries for all governance actions'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.id IS 'Unique audit log identifier (UUID)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.actor_id IS 'ID of the actor who performed the action'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.actor_type IS 'Type of actor: user, system, api_key, project'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.action IS 'Action performed (e.g., project.created, key.rotated)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.target_type IS 'Type of target resource'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.target_id IS 'ID of target resource'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.project_id IS 'Associated project ID'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.request_id IS 'Request ID for tracing'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.metadata IS 'Additional context (JSONB)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.ip_address IS 'IP address of the request'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.user_agent IS 'User agent string'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.audit_logs.severity IS 'Severity level: info, warning, error, critical'
      `)

      console.log('[Migration] Added comments to audit_logs table')

    } else {
      console.log('[Migration] audit_logs table already exists in control_plane schema')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating audit_logs table:', error)
    return { success: false, error }
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  data: {
    actor_id?: string;
    actor_type: string;
    action: string;
    target_type?: string;
    target_id?: string;
    project_id?: string;
    request_id?: string;
    metadata?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    severity?: string;
  }
): Promise<{ success: boolean; auditLog?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO control_plane.audit_logs (
        actor_id, actor_type, action, target_type, target_id,
        project_id, request_id, metadata, ip_address, user_agent, severity
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        data.actor_id || null,
        data.actor_type,
        data.action,
        data.target_type || null,
        data.target_id || null,
        data.project_id || null,
        data.request_id || null,
        JSON.stringify(data.metadata || {}),
        data.ip_address || null,
        data.user_agent || null,
        data.severity || 'info',
      ]
    )

    return { success: true, auditLog: result.rows[0] }
  } catch (error) {
    console.error('[Audit Logs] Error creating audit log:', error)
    return { success: false, error }
  }
}

/**
 * Get audit log by ID
 */
export async function getAuditLog(logId: string): Promise<{ success: boolean; auditLog?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT * FROM control_plane.audit_logs
      WHERE id = $1
      `,
      [logId]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Audit log not found' }
    }

    return { success: true, auditLog: result.rows[0] }
  } catch (error) {
    console.error('[Audit Logs] Error getting audit log:', error)
    return { success: false, error }
  }
}

/**
 * List audit logs with filters
 */
export async function listAuditLogs(
  filters: {
    actor_id?: string;
    actor_type?: string;
    action?: string;
    target_type?: string;
    target_id?: string;
    project_id?: string;
    request_id?: string;
    severity?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ success: boolean; auditLogs?: any[]; total?: number; error?: unknown }> {
  const pool = getPool()

  try {
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (filters.actor_id) {
      conditions.push(`actor_id = $${paramIndex++}`)
      values.push(filters.actor_id)
    }

    if (filters.actor_type) {
      conditions.push(`actor_type = $${paramIndex++}`)
      values.push(filters.actor_type)
    }

    if (filters.action) {
      conditions.push(`action = $${paramIndex++}`)
      values.push(filters.action)
    }

    if (filters.target_type) {
      conditions.push(`target_type = $${paramIndex++}`)
      values.push(filters.target_type)
    }

    if (filters.target_id) {
      conditions.push(`target_id = $${paramIndex++}`)
      values.push(filters.target_id)
    }

    if (filters.project_id) {
      conditions.push(`project_id = $${paramIndex++}`)
      values.push(filters.project_id)
    }

    if (filters.request_id) {
      conditions.push(`request_id = $${paramIndex++}`)
      values.push(filters.request_id)
    }

    if (filters.severity) {
      conditions.push(`severity = $${paramIndex++}`)
      values.push(filters.severity)
    }

    if (filters.start_date) {
      conditions.push(`created_at >= $${paramIndex++}`)
      values.push(filters.start_date)
    }

    if (filters.end_date) {
      conditions.push(`created_at <= $${paramIndex++}`)
      values.push(filters.end_date)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = filters.limit || 100
    const offset = filters.offset || 0

    // Get total count
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM control_plane.audit_logs
      ${whereClause}
      `,
      values
    )

    const total = parseInt(countResult.rows[0].total)

    // Get audit logs with pagination
    values.push(limit, offset)
    const result = await pool.query(
      `
      SELECT * FROM control_plane.audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `,
      values
    )

    return { success: true, auditLogs: result.rows, total }
  } catch (error) {
    console.error('[Audit Logs] Error listing audit logs:', error)
    return { success: false, error }
  }
}
