import { getPool } from '@/lib/db'
import { Pool } from 'pg'

/**
 * Migration: Create notifications table
 *
 * This table tracks all notifications sent for abuse control events.
 * Supports multiple delivery channels (email, SMS, in-app, webhook)
 * and tracks delivery status.
 */
export async function createNotificationsTable() {
  const pool = getPool()

  try {
    // Check if notifications table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notifications'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the notifications table
      await pool.query(`
        CREATE TABLE notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          notification_type VARCHAR(50) NOT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          subject VARCHAR(500) NOT NULL,
          body TEXT NOT NULL,
          data JSONB NOT NULL DEFAULT '{}',
          channels VARCHAR(50)[] NOT NULL DEFAULT ARRAY['email'],
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          delivered_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT
        )
      `)

      console.log('[Migration] Created notifications table')

      // Create index on project_id for faster lookups
      await pool.query(`
        CREATE INDEX idx_notifications_project_id ON notifications(project_id)
      `)

      console.log('[Migration] Created index on notifications.project_id')

      // Create index on status for filtering pending/failed notifications
      await pool.query(`
        CREATE INDEX idx_notifications_status ON notifications(status)
      `)

      console.log('[Migration] Created index on notifications.status')

      // Create index on created_at for time-based queries
      await pool.query(`
        CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC)
      `)

      console.log('[Migration] Created index on notifications.created_at')

      // Create index on notification_type for filtering by type
      await pool.query(`
        CREATE INDEX idx_notifications_type ON notifications(notification_type)
      `)

      console.log('[Migration] Created index on notifications.notification_type')

      // Create composite index for retry queries
      await pool.query(`
        CREATE INDEX idx_notifications_retry ON notifications(status, attempts, created_at)
        WHERE status = 'failed'
      `)

      console.log('[Migration] Created index for notification retry queries')

      // Add check constraint for notification_type
      await pool.query(`
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_type_check
        CHECK (notification_type IN (
          'project_suspended',
          'project_unsuspended',
          'quota_warning',
          'usage_spike_detected',
          'error_rate_detected',
          'malicious_pattern_detected'
        ))
      `)

      console.log('[Migration] Added notification_type check constraint')

      // Add check constraint for priority
      await pool.query(`
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_priority_check
        CHECK (priority IN ('low', 'medium', 'high', 'critical'))
      `)

      console.log('[Migration] Added priority check constraint')

      // Add check constraint for status
      await pool.query(`
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_status_check
        CHECK (status IN ('pending', 'delivered', 'failed', 'retrying'))
      `)

      console.log('[Migration] Added status check constraint')

      // Add check constraint for channels
      await pool.query(`
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_channels_check
        CHECK (channels <@ ARRAY['email', 'in_app', 'sms', 'webhook']::VARCHAR(50)[])
      `)

      console.log('[Migration] Added channels check constraint')
    } else {
      console.log('[Migration] notifications table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating notifications table:', error)
    return { success: false, error }
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatistics() {
  const pool = getPool()

  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE status = 'retrying') as retrying_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d_count
      FROM notifications
    `)

    return {
      success: true,
      data: result.rows[0],
    }
  } catch (error) {
    console.error('[Notifications] Error getting statistics:', error)
    return {
      success: false,
      error,
    }
  }
}

/**
 * Get pending notifications for delivery
 */
export async function getPendingNotifications(limit: number = 10) {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        notification_type,
        priority,
        subject,
        body,
        data,
        channels,
        attempts
      FROM notifications
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT $1
      `,
      [limit]
    )

    return {
      success: true,
      data: result.rows,
    }
  } catch (error) {
    console.error('[Notifications] Error getting pending notifications:', error)
    return {
      success: false,
      error,
    }
  }
}
