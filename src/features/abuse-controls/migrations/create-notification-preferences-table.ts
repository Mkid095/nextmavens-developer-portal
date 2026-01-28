import { getPool } from '@/lib/db'

/**
 * Migration: Create notification_preferences table
 *
 * This table stores user notification preferences for different notification types
 * and delivery channels. Allows users to customize how they receive notifications.
 */
export async function createNotificationPreferencesTable() {
  const pool = getPool()

  try {
    // Check if notification_preferences table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notification_preferences'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the notification_preferences table
      await pool.query(`
        CREATE TABLE notification_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          notification_type VARCHAR(50) NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT true,
          channels VARCHAR(50)[] NOT NULL DEFAULT ARRAY['email'],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, project_id, notification_type)
        )
      `)

      console.log('[Migration] Created notification_preferences table')

      // Create index on user_id for faster lookups
      await pool.query(`
        CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id)
      `)

      console.log('[Migration] Created index on notification_preferences.user_id')

      // Create index on project_id for project-specific preferences
      await pool.query(`
        CREATE INDEX idx_notification_preferences_project_id ON notification_preferences(project_id)
      `)

      console.log('[Migration] Created index on notification_preferences.project_id')

      // Create index on notification_type for filtering by type
      await pool.query(`
        CREATE INDEX idx_notification_preferences_type ON notification_preferences(notification_type)
      `)

      console.log('[Migration] Created index on notification_preferences.notification_type')

      // Add check constraint for notification_type
      await pool.query(`
        ALTER TABLE notification_preferences
        ADD CONSTRAINT notification_preferences_type_check
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

      // Add check constraint for channels
      await pool.query(`
        ALTER TABLE notification_preferences
        ADD CONSTRAINT notification_preferences_channels_check
        CHECK (channels <@ ARRAY['email', 'in_app', 'sms', 'webhook']::VARCHAR(50)[])
      `)

      console.log('[Migration] Added channels check constraint')

      // Create trigger to update updated_at timestamp
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `)

      await pool.query(`
        CREATE TRIGGER notification_preferences_updated_at
          BEFORE UPDATE ON notification_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_notification_preferences_updated_at()
      `)

      console.log('[Migration] Created trigger for updated_at timestamp')
    } else {
      console.log('[Migration] notification_preferences table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating notification_preferences table:', error)
    return { success: false, error }
  }
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string,
  projectId?: string
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    user_id: string
    project_id: string | null
    notification_type: string
    enabled: boolean
    channels: string[]
    created_at: Date
    updated_at: Date
  }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    let query = `
      SELECT
        id,
        user_id,
        project_id,
        notification_type,
        enabled,
        channels,
        created_at,
        updated_at
      FROM notification_preferences
      WHERE user_id = $1
    `
    const params: (string | null)[] = [userId]

    if (projectId) {
      query += ` AND (project_id = $2 OR project_id IS NULL)`
      params.push(projectId)
    }

    query += ` ORDER BY project_id NULLS LAST, notification_type ASC`

    const result = await pool.query(query, params)

    return {
      success: true,
      data: result.rows,
    }
  } catch (error) {
    console.error('[NotificationPreferences] Error getting preferences:', error)
    return {
      success: false,
      error,
    }
  }
}

/**
 * Upsert notification preference for a user
 */
export async function upsertNotificationPreference(
  userId: string,
  notificationType: string,
  enabled: boolean,
  channels: string[],
  projectId?: string
): Promise<{
  success: boolean
  data?: { id: string }
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO notification_preferences (user_id, project_id, notification_type, enabled, channels)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, project_id, notification_type)
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        channels = EXCLUDED.channels,
        updated_at = NOW()
      RETURNING id
      `,
      [userId, projectId || null, notificationType, enabled, channels]
    )

    return {
      success: true,
      data: { id: result.rows[0].id },
    }
  } catch (error) {
    console.error('[NotificationPreferences] Error upserting preference:', error)
    return {
      success: false,
      error,
    }
  }
}

/**
 * Delete notification preference
 */
export async function deleteNotificationPreference(
  userId: string,
  projectId: string | undefined,
  notificationType: string
): Promise<{
  success: boolean
  error?: unknown
}> {
  const pool = getPool()

  try {
    await pool.query(
      `
      DELETE FROM notification_preferences
      WHERE user_id = $1
        AND project_id IS NOT DISTINCT FROM $2
        AND notification_type = $3
      `,
      [userId, projectId || null, notificationType]
    )

    return { success: true }
  } catch (error) {
    console.error('[NotificationPreferences] Error deleting preference:', error)
    return {
      success: false,
      error,
    }
  }
}

/**
 * Get default notification preferences for a user
 */
export async function getDefaultNotificationPreferences(
  userId: string
): Promise<{
  success: boolean
  data?: Array<{
    notification_type: string
    enabled: boolean
    channels: string[]
  }>
  error?: unknown
}> {
  // Return default preferences
  // All notification types enabled, email channel only
  const defaultPreferences = [
    {
      notification_type: 'project_suspended',
      enabled: true,
      channels: ['email'],
    },
    {
      notification_type: 'project_unsuspended',
      enabled: true,
      channels: ['email'],
    },
    {
      notification_type: 'quota_warning',
      enabled: true,
      channels: ['email'],
    },
    {
      notification_type: 'usage_spike_detected',
      enabled: true,
      channels: ['email'],
    },
    {
      notification_type: 'error_rate_detected',
      enabled: true,
      channels: ['email'],
    },
    {
      notification_type: 'malicious_pattern_detected',
      enabled: true,
      channels: ['email'],
    },
  ]

  return {
    success: true,
    data: defaultPreferences,
  }
}

/**
 * Apply default notification preferences for a new user
 */
export async function applyDefaultNotificationPreferences(userId: string): Promise<{
  success: boolean
  error?: unknown
}> {
  const pool = getPool()

  try {
    const defaultPreferences = await getDefaultNotificationPreferences(userId)

    if (!defaultPreferences.data) {
      return { success: false }
    }

    for (const preference of defaultPreferences.data) {
      await pool.query(
        `
        INSERT INTO notification_preferences (user_id, notification_type, enabled, channels)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, project_id, notification_type) DO NOTHING
        `,
        [userId, preference.notification_type, preference.enabled, preference.channels]
      )
    }

    console.log(`[NotificationPreferences] Applied default preferences for user ${userId}`)

    return { success: true }
  } catch (error) {
    console.error('[NotificationPreferences] Error applying default preferences:', error)
    return {
      success: false,
      error,
    }
  }
}
