/**
 * Migration: Create suspension_notifications table
 *
 * This migration creates a table to track suspension-specific notifications
 * sent to project owners when their projects exceed hard caps.
 */

import { getPool } from '@/lib/db'

export async function up(): Promise<void> {
  const pool = getPool()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Create suspension_notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suspension_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        recipient_emails TEXT[] NOT NULL,
        reason TEXT NOT NULL,
        cap_exceeded VARCHAR(100) NOT NULL,
        current_usage BIGINT NOT NULL,
        limit BIGINT NOT NULL,
        support_contact TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'sent', 'failed')),
        sent_at TIMESTAMP WITH TIME ZONE,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)

    // Create index on project_id and created_at for efficient project notification queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_suspension_notifications_project_created
      ON suspension_notifications(project_id, created_at DESC)
    `)

    // Create index on status and created_at for efficient pending notification queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_suspension_notifications_status_created
      ON suspension_notifications(status, created_at DESC)
    `)

    // Add comments for documentation
    await client.query(`
      COMMENT ON TABLE suspension_notifications IS
      'Tracks suspension notifications sent to project owners when projects exceed hard caps'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.id IS
      'Unique identifier for the notification'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.project_id IS
      'Reference to the project that was suspended'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.recipient_emails IS
      'Array of email addresses that received the notification'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.reason IS
      'Human-readable reason for the suspension'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.cap_exceeded IS
      'The hard cap type that was exceeded (e.g., db_queries_per_day)'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.current_usage IS
      'The current usage value when the suspension occurred'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.limit IS
      'The hard cap limit that was exceeded'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.support_contact IS
      'Support contact information provided in the notification'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.status IS
      'Current delivery status: pending, sent, or failed'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.sent_at IS
      'Timestamp when the notification was successfully sent'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.error IS
      'Error message if the notification delivery failed'
    `)

    await client.query(`
      COMMENT ON COLUMN suspension_notifications.created_at IS
      'Timestamp when the notification record was created'
    `)

    await client.query('COMMIT')
    console.log('[Migration] Created suspension_notifications table successfully')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[Migration] Failed to create suspension_notifications table:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function down(): Promise<void> {
  const pool = getPool()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Drop indexes
    await client.query(`
      DROP INDEX IF EXISTS idx_suspension_notifications_status_created
    `)

    await client.query(`
      DROP INDEX IF EXISTS idx_suspension_notifications_project_created
    `)

    // Drop table
    await client.query(`
      DROP TABLE IF EXISTS suspension_notifications
    `)

    await client.query('COMMIT')
    console.log('[Migration] Dropped suspension_notifications table successfully')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[Migration] Failed to drop suspension_notifications table:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
