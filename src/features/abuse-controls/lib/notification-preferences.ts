/**
 * Notification Preferences Library
 *
 * Manages user notification preferences for different notification types
 * and delivery channels. Provides a centralized API for managing preferences.
 */

import { getPool } from '@/lib/db'
import type {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../types'

/**
 * User notification preference
 */
export interface NotificationPreference {
  id: string
  user_id: string
  project_id: string | null
  notification_type: NotificationType
  enabled: boolean
  channels: NotificationChannel[]
  created_at: Date
  updated_at: Date
}

/**
 * Notification preference input
 */
export interface NotificationPreferenceInput {
  notification_type: NotificationType
  enabled: boolean
  channels: NotificationChannel[]
}

/**
 * Get notification preferences for a user
 *
 * @param userId - The user ID to get preferences for
 * @param projectId - Optional project ID to filter by
 * @returns Array of notification preferences
 */
export async function getNotificationPreferences(
  userId: string,
  projectId?: string
): Promise<NotificationPreference[]> {
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
  } catch (error) {
    console.error('[NotificationPreferences] Error getting preferences:', error)
    throw new Error('Failed to get notification preferences')
  }
}

/**
 * Get notification preference for a specific type
 *
 * @param userId - The user ID
 * @param notificationType - The notification type
 * @param projectId - Optional project ID
 * @returns The notification preference or null
 */
export async function getNotificationPreference(
  userId: string,
  notificationType: NotificationType,
  projectId?: string
): Promise<NotificationPreference | null> {
  const pool = getPool()

  try {
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
  } catch (error) {
    console.error('[NotificationPreferences] Error getting preference:', error)
    throw new Error('Failed to get notification preference')
  }
}

/**
 * Upsert notification preference
 *
 * @param userId - The user ID
 * @param notificationType - The notification type
 * @param enabled - Whether notifications are enabled
 * @param channels - Delivery channels
 * @param projectId - Optional project ID
 * @returns The created/updated preference ID
 */
export async function upsertNotificationPreference(
  userId: string,
  notificationType: NotificationType,
  enabled: boolean,
  channels: NotificationChannel[],
  projectId?: string
): Promise<string> {
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

    console.log(
      `[NotificationPreferences] Upserted preference for user ${userId}, type ${notificationType}`
    )

    return result.rows[0].id
  } catch (error) {
    console.error('[NotificationPreferences] Error upserting preference:', error)
    throw new Error('Failed to upsert notification preference')
  }
}

/**
 * Delete notification preference
 *
 * @param userId - The user ID
 * @param notificationType - The notification type
 * @param projectId - Optional project ID
 * @returns Whether the deletion was successful
 */
export async function deleteNotificationPreference(
  userId: string,
  notificationType: NotificationType,
  projectId?: string
): Promise<boolean> {
  const pool = getPool()

  try {
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
  } catch (error) {
    console.error('[NotificationPreferences] Error deleting preference:', error)
    throw new Error('Failed to delete notification preference')
  }
}

/**
 * Get default notification preferences
 *
 * @returns Array of default notification preferences
 */
export function getDefaultNotificationPreferences(): NotificationPreferenceInput[] {
  return [
    {
      notification_type: 'project_suspended' as NotificationType,
      enabled: true,
      channels: ['email' as NotificationChannel],
    },
    {
      notification_type: 'project_unsuspended' as NotificationType,
      enabled: true,
      channels: ['email' as NotificationChannel],
    },
    {
      notification_type: 'quota_warning' as NotificationType,
      enabled: true,
      channels: ['email' as NotificationChannel],
    },
    {
      notification_type: 'usage_spike_detected' as NotificationType,
      enabled: true,
      channels: ['email' as NotificationChannel],
    },
    {
      notification_type: 'error_rate_detected' as NotificationType,
      enabled: true,
      channels: ['email' as NotificationChannel],
    },
    {
      notification_type: 'malicious_pattern_detected' as NotificationType,
      enabled: true,
      channels: ['email' as NotificationChannel],
    },
  ]
}

/**
 * Apply default notification preferences for a new user
 *
 * @param userId - The user ID to apply defaults for
 * @returns Whether the operation was successful
 */
export async function applyDefaultNotificationPreferences(userId: string): Promise<boolean> {
  const pool = getPool()

  try {
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
  } catch (error) {
    console.error('[NotificationPreferences] Error applying default preferences:', error)
    throw new Error('Failed to apply default notification preferences')
  }
}

/**
 * Check if a user should receive a notification
 *
 * @param userId - The user ID
 * @param notificationType - The notification type
 * @param projectId - Optional project ID
 * @returns Whether the user should receive the notification
 */
export async function shouldReceiveNotification(
  userId: string,
  notificationType: NotificationType,
  projectId?: string
): Promise<boolean> {
  try {
    const preference = await getNotificationPreference(userId, notificationType, projectId)

    // If no preference exists, default to enabled
    if (!preference) {
      return true
    }

    return preference.enabled
  } catch (error) {
    console.error('[NotificationPreferences] Error checking if should receive:', error)
    // On error, default to enabled to avoid missing notifications
    return true
  }
}

/**
 * Get enabled channels for a notification type
 *
 * @param userId - The user ID
 * @param notificationType - The notification type
 * @param projectId - Optional project ID
 * @returns Array of enabled channels
 */
export async function getEnabledChannels(
  userId: string,
  notificationType: NotificationType,
  projectId?: string
): Promise<NotificationChannel[]> {
  try {
    const preference = await getNotificationPreference(userId, notificationType, projectId)

    // If no preference exists, default to email
    if (!preference) {
      return ['email' as NotificationChannel]
    }

    return preference.channels
  } catch (error) {
    console.error('[NotificationPreferences] Error getting enabled channels:', error)
    // On error, default to email
    return ['email' as NotificationChannel]
  }
}

/**
 * Notification Preferences Manager Class
 *
 * Provides a centralized API for managing notification preferences.
 */
export class NotificationPreferencesManager {
  /**
   * Get all notification preferences for a user
   */
  static async getAll(
    userId: string,
    projectId?: string
  ): Promise<NotificationPreference[]> {
    return getNotificationPreferences(userId, projectId)
  }

  /**
   * Get a specific notification preference
   */
  static async get(
    userId: string,
    notificationType: NotificationType,
    projectId?: string
  ): Promise<NotificationPreference | null> {
    return getNotificationPreference(userId, notificationType, projectId)
  }

  /**
   * Create or update a notification preference
   */
  static async set(
    userId: string,
    notificationType: NotificationType,
    enabled: boolean,
    channels: NotificationChannel[],
    projectId?: string
  ): Promise<string> {
    return upsertNotificationPreference(userId, notificationType, enabled, channels, projectId)
  }

  /**
   * Set multiple preferences at once
   */
  static async setMany(
    userId: string,
    preferences: NotificationPreferenceInput[],
    projectId?: string
  ): Promise<string[]> {
    const ids: string[] = []

    for (const preference of preferences) {
      const id = await upsertNotificationPreference(
        userId,
        preference.notification_type,
        preference.enabled,
        preference.channels,
        projectId
      )
      ids.push(id)
    }

    return ids
  }

  /**
   * Delete a notification preference
   */
  static async delete(
    userId: string,
    notificationType: NotificationType,
    projectId?: string
  ): Promise<boolean> {
    return deleteNotificationPreference(userId, notificationType, projectId)
  }

  /**
   * Check if user should receive notification
   */
  static async shouldReceive(
    userId: string,
    notificationType: NotificationType,
    projectId?: string
  ): Promise<boolean> {
    return shouldReceiveNotification(userId, notificationType, projectId)
  }

  /**
   * Get enabled channels for a notification type
   */
  static async getChannels(
    userId: string,
    notificationType: NotificationType,
    projectId?: string
  ): Promise<NotificationChannel[]> {
    return getEnabledChannels(userId, notificationType, projectId)
  }

  /**
   * Apply default preferences for a new user
   */
  static async applyDefaults(userId: string): Promise<boolean> {
    return applyDefaultNotificationPreferences(userId)
  }

  /**
   * Get default preferences template
   */
  static getDefaults(): NotificationPreferenceInput[] {
    return getDefaultNotificationPreferences()
  }
}
