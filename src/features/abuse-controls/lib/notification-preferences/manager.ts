/**
 * Notification Preferences Module - Manager Class
 *
 * Provides a centralized API for managing notification preferences.
 */

import type { NotificationPreference, NotificationPreferenceInput } from './types'
import type { NotificationType, NotificationChannel } from '../../types'
import * as queries from './queries'
import { getDefaultNotificationPreferences } from './defaults'

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
    return queries.queryNotificationPreferences(userId, projectId)
  }

  /**
   * Get a specific notification preference
   */
  static async get(
    userId: string,
    notificationType: NotificationType,
    projectId?: string
  ): Promise<NotificationPreference | null> {
    return queries.queryNotificationPreference(userId, notificationType, projectId)
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
    return queries.upsertNotificationPreference(userId, notificationType, enabled, channels, projectId)
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
      const id = await queries.upsertNotificationPreference(
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
    return queries.deleteNotificationPreference(userId, notificationType, projectId)
  }

  /**
   * Check if user should receive notification
   */
  static async shouldReceive(
    userId: string,
    notificationType: NotificationType,
    projectId?: string
  ): Promise<boolean> {
    const preference = await queries.queryNotificationPreference(userId, notificationType, projectId)

    // If no preference exists, default to enabled
    if (!preference) {
      return true
    }

    return preference.enabled
  }

  /**
   * Get enabled channels for a notification type
   */
  static async getChannels(
    userId: string,
    notificationType: NotificationType,
    projectId?: string
  ): Promise<NotificationChannel[]> {
    const preference = await queries.queryNotificationPreference(userId, notificationType, projectId)

    // If no preference exists, default to email
    if (!preference) {
      return ['email' as NotificationChannel]
    }

    return preference.channels
  }

  /**
   * Apply default preferences for a new user
   */
  static async applyDefaults(userId: string): Promise<boolean> {
    return queries.applyDefaultNotificationPreferences(userId)
  }

  /**
   * Get default preferences template
   */
  static getDefaults(): NotificationPreferenceInput[] {
    return getDefaultNotificationPreferences()
  }
}
