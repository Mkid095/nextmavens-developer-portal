/**
 * Notification Preferences Module - Database Queries
 */

import { getPool } from '@/lib/db'
import type { NotificationPreference, NotificationPreferenceInput } from './types'
import type { NotificationType, NotificationChannel } from '../../types'

/**
 * Query notification preferences for a user
 */
export async function queryNotificationPreferences(
  userId: string,
  projectId?: string
): Promise<NotificationPreference[]> {
  const pool = getPool()

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

  return result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    notification_type: row.notification_type as NotificationType,
    enabled: row.enabled,
    channels: row.channels as NotificationChannel[],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

/**
 * Query a specific notification preference
 */
export async function queryNotificationPreference(
  userId: string,
  notificationType: NotificationType,
  projectId?: string
): Promise<NotificationPreference | null> {
  const pool = getPool()

  const result = await pool.query(
    `
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
      AND notification_type = $2
      AND project_id IS NOT DISTINCT FROM $3
    ORDER BY project_id DESC
    LIMIT 1
    `,
    [userId, notificationType, projectId || null]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]

  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    notification_type: row.notification_type as NotificationType,
    enabled: row.enabled,
    channels: row.channels as NotificationChannel[],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/**
 * Upsert notification preference
 */
export async function upsertNotificationPreference(
  userId: string,
  notificationType: NotificationType,
  enabled: boolean,
  channels: NotificationChannel[],
  projectId?: string
): Promise<string> {
  const pool = getPool()

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

  console.log(
    `[NotificationPreferences] Upserted preference for user ${userId}, type ${notificationType}`
  )

  return result.rows[0].id
}

/**
 * Delete notification preference
 */
export async function deleteNotificationPreference(
  userId: string,
  notificationType: NotificationType,
  projectId?: string
): Promise<boolean> {
  const pool = getPool()

  const result = await pool.query(
    `
    DELETE FROM notification_preferences
    WHERE user_id = $1
      AND notification_type = $2
      AND project_id IS NOT DISTINCT FROM $3
    `,
    [userId, notificationType, projectId || null]
  )

  const deleted = result.rowCount || 0

  if (deleted > 0) {
    console.log(
      `[NotificationPreferences] Deleted preference for user ${userId}, type ${notificationType}`
    )
  }

  return deleted > 0
}

/**
 * Apply default notification preferences for a new user
 */
export async function applyDefaultNotificationPreferences(userId: string): Promise<boolean> {
  const pool = getPool()
  const { getDefaultNotificationPreferences } = await import('./defaults')

  const defaults = getDefaultNotificationPreferences()

  for (const preference of defaults) {
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

  return true
}
