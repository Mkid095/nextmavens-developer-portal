import { getPool } from '@/lib/db'

/**
 * Migration: Create webhooks and event_logs tables for Webhooks Management API
 *
 * These tables store webhook configurations and delivery logs.
 *
 * webhooks table:
 *   - Columns: id, project_id, event, target_url, secret, enabled, created_at, updated_at
 *
 * event_logs table (webhook delivery history):
 *   - Columns: id, webhook_id, project_id, event_type, payload, status,
 *              http_status_code, response_body, error_message, delivered_at, created_at
 *
 * Event types: project.created, project.updated, project.deleted, project.suspended,
 *               project.activated, user.signedup, file.uploaded, key.created, key.rotated,
 *               key.revoked, quota.exceeded, webhook.delivered, webhook.failed
 */
export async function createWebhooksTables() {
  const pool = getPool()

  try {
    // Ensure control_plane schema exists
    await pool.query(`CREATE SCHEMA IF NOT EXISTS control_plane`)

    // Check if webhooks table exists
    const webhooksCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'webhooks'
        AND table_schema = 'control_plane'
      )
    `)

    const webhooksExists = webhooksCheck.rows[0].exists

    if (!webhooksExists) {
      // Create webhooks table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.webhooks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES control_plane.projects(id) ON DELETE CASCADE,
          event VARCHAR(100) NOT NULL,
          target_url VARCHAR(2048) NOT NULL,
          secret VARCHAR(255),
          enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT webhooks_event_check CHECK (event IN (
            'project.created',
            'project.updated',
            'project.deleted',
            'project.suspended',
            'project.activated',
            'user.signedup',
            'file.uploaded',
            'key.created',
            'key.rotated',
            'key.revoked',
            'quota.exceeded',
            'webhook.delivered',
            'webhook.failed'
          )),

          UNIQUE(project_id, event, target_url)
        )
      `)

      console.log('[Migration] Created webhooks table in control_plane schema')

      // Create indexes for webhooks
      await pool.query(`
        CREATE INDEX idx_webhooks_project_id
        ON control_plane.webhooks(project_id)
      `)

      await pool.query(`
        CREATE INDEX idx_webhooks_event
        ON control_plane.webhooks(event)
      `)

      await pool.query(`
        CREATE INDEX idx_webhooks_enabled
        ON control_plane.webhooks(enabled)
      `)

      console.log('[Migration] Created indexes on webhooks table')

      // Add comments to webhooks table
      await pool.query(`
        COMMENT ON TABLE control_plane.webhooks IS 'Webhook configurations for event notifications'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.webhooks.id IS 'Unique webhook identifier (UUID)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.webhooks.project_id IS 'Associated project ID'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.webhooks.event IS 'Event type to listen for'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.webhooks.target_url IS 'Webhook endpoint URL'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.webhooks.secret IS 'HMAC secret for webhook signature verification'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.webhooks.enabled IS 'Whether webhook is active'
      `)

    } else {
      console.log('[Migration] webhooks table already exists in control_plane schema')
    }

    // Check if event_logs table exists
    const eventLogsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'event_logs'
        AND table_schema = 'control_plane'
      )
    `)

    const eventLogsExists = eventLogsCheck.rows[0].exists

    if (!eventLogsExists) {
      // Create event_logs table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.event_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          webhook_id UUID NOT NULL REFERENCES control_plane.webhooks(id) ON DELETE CASCADE,
          project_id UUID NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          http_status_code INTEGER,
          response_body TEXT,
          error_message TEXT,
          delivered_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT event_logs_status_check CHECK (status IN (
            'pending',
            'delivered',
            'failed'
          ))
        )
      `)

      console.log('[Migration] Created event_logs table in control_plane schema')

      // Create indexes for event_logs
      await pool.query(`
        CREATE INDEX idx_event_logs_webhook_id
        ON control_plane.event_logs(webhook_id)
      `)

      await pool.query(`
        CREATE INDEX idx_event_logs_project_id
        ON control_plane.event_logs(project_id)
      `)

      await pool.query(`
        CREATE INDEX idx_event_logs_status
        ON control_plane.event_logs(status)
      `)

      await pool.query(`
        CREATE INDEX idx_event_logs_event_type
        ON control_plane.event_logs(event_type)
      `)

      await pool.query(`
        CREATE INDEX idx_event_logs_created_at
        ON control_plane.event_logs(created_at DESC)
      `)

      console.log('[Migration] Created indexes on event_logs table')

      // Add comments to event_logs table
      await pool.query(`
        COMMENT ON TABLE control_plane.event_logs IS 'Webhook delivery history logs'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.id IS 'Unique event log identifier (UUID)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.webhook_id IS 'Associated webhook ID'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.project_id IS 'Associated project ID'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.event_type IS 'Event type that was delivered'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.payload IS 'Event payload (JSONB)'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.status IS 'Delivery status: pending, delivered, failed'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.http_status_code IS 'HTTP status code from webhook endpoint'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.response_body IS 'Response body from webhook endpoint'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.error_message IS 'Error message if delivery failed'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.event_logs.delivered_at IS 'Timestamp when webhook was delivered'
      `)

    } else {
      console.log('[Migration] event_logs table already exists in control_plane schema')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating webhooks tables:', error)
    return { success: false, error }
  }
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  data: {
    project_id: string;
    event: string;
    target_url: string;
    secret?: string;
    enabled?: boolean;
  }
): Promise<{ success: boolean; webhook?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO control_plane.webhooks (project_id, event, target_url, secret, enabled)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [data.project_id, data.event, data.target_url, data.secret || null, data.enabled ?? true]
    )

    return { success: true, webhook: result.rows[0] }
  } catch (error) {
    console.error('[Webhooks] Error creating webhook:', error)
    return { success: false, error }
  }
}

/**
 * Get webhook by ID
 */
export async function getWebhook(webhookId: string): Promise<{ success: boolean; webhook?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT * FROM control_plane.webhooks
      WHERE id = $1
      `,
      [webhookId]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Webhook not found' }
    }

    return { success: true, webhook: result.rows[0] }
  } catch (error) {
    console.error('[Webhooks] Error getting webhook:', error)
    return { success: false, error }
  }
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  updates: {
    event?: string;
    target_url?: string;
    secret?: string;
    enabled?: boolean;
  }
): Promise<{ success: boolean; webhook?: any; error?: unknown }> {
  const pool = getPool()

  try {
    const setClause: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    })

    if (setClause.length === 0) {
      return { success: false, error: 'No updates provided' }
    }

    setClause.push(`updated_at = NOW()`)
    values.push(webhookId)

    const result = await pool.query(
      `
      UPDATE control_plane.webhooks
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
      `,
      values
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Webhook not found' }
    }

    return { success: true, webhook: result.rows[0] }
  } catch (error) {
    console.error('[Webhooks] Error updating webhook:', error)
    return { success: false, error }
  }
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: string): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      DELETE FROM control_plane.webhooks
      WHERE id = $1
      RETURNING id
      `,
      [webhookId]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Webhook not found' }
    }

    return { success: true }
  } catch (error) {
    console.error('[Webhooks] Error deleting webhook:', error)
    return { success: false, error }
  }
}

/**
 * List webhooks with filters
 */
export async function listWebhooks(
  filters: {
    project_id?: string;
    event?: string;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ success: boolean; webhooks?: any[]; total?: number; error?: unknown }> {
  const pool = getPool()

  try {
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (filters.project_id) {
      conditions.push(`project_id = $${paramIndex++}`)
      values.push(filters.project_id)
    }

    if (filters.event) {
      conditions.push(`event = $${paramIndex++}`)
      values.push(filters.event)
    }

    if (filters.enabled !== undefined) {
      conditions.push(`enabled = $${paramIndex++}`)
      values.push(filters.enabled)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = filters.limit || 50
    const offset = filters.offset || 0

    // Get total count
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM control_plane.webhooks
      ${whereClause}
      `,
      values
    )

    const total = parseInt(countResult.rows[0].total)

    // Get webhooks with pagination
    values.push(limit, offset)
    const result = await pool.query(
      `
      SELECT * FROM control_plane.webhooks
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `,
      values
    )

    return { success: true, webhooks: result.rows, total }
  } catch (error) {
    console.error('[Webhooks] Error listing webhooks:', error)
    return { success: false, error }
  }
}

/**
 * List event logs (webhook delivery history)
 */
export async function listEventLogs(
  filters: {
    project_id?: string;
    webhook_id?: string;
    event_type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ success: boolean; eventLogs?: any[]; total?: number; error?: unknown }> {
  const pool = getPool()

  try {
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (filters.project_id) {
      conditions.push(`project_id = $${paramIndex++}`)
      values.push(filters.project_id)
    }

    if (filters.webhook_id) {
      conditions.push(`webhook_id = $${paramIndex++}`)
      values.push(filters.webhook_id)
    }

    if (filters.event_type) {
      conditions.push(`event_type = $${paramIndex++}`)
      values.push(filters.event_type)
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`)
      values.push(filters.status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = filters.limit || 100
    const offset = filters.offset || 0

    // Get total count
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM control_plane.event_logs
      ${whereClause}
      `,
      values
    )

    const total = parseInt(countResult.rows[0].total)

    // Get event logs with pagination
    values.push(limit, offset)
    const result = await pool.query(
      `
      SELECT * FROM control_plane.event_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `,
      values
    )

    return { success: true, eventLogs: result.rows, total }
  } catch (error) {
    console.error('[Webhooks] Error listing event logs:', error)
    return { success: false, error }
  }
}
