/**
 * Notification Manager - Main interface for notification operations
 */

import {
  sendSuspensionNotification,
  getNotificationRecipients,
  createSuspensionNotificationTemplate,
  formatSuspensionNotificationEmail,
  createNotification,
  getNotification,
  getProjectNotifications,
  retryFailedNotifications,
} from '../notifications'
import {
  getNotificationPreferences,
  getNotificationPreference,
  upsertNotificationPreference,
  deleteNotificationPreference,
  getDefaultNotificationPreferences,
  applyDefaultNotificationPreferences,
  shouldReceiveNotification,
  getEnabledChannels,
} from '../notification-preferences'
import type { Notification, NotificationRecipient, NotificationDeliveryResult, SuspensionReason } from '../../types'

/**
 * Notification Manager - Main interface for notification operations
 */
export class NotificationManager {
  /**
   * Send suspension notification to project stakeholders
   */
  static async sendSuspensionNotification(
    projectId: string,
    projectName: string,
    orgName: string,
    reason: SuspensionReason,
    suspendedAt: Date
  ): Promise<NotificationDeliveryResult[]> {
    return sendSuspensionNotification(projectId, projectName, orgName, reason, suspendedAt)
  }

  /**
   * Get notification recipients for a project
   */
  static async getRecipients(projectId: string): Promise<NotificationRecipient[]> {
    return getNotificationRecipients(projectId)
  }

  /**
   * Create suspension notification template
   */
  static createSuspensionTemplate(
    projectName: string,
    orgName: string,
    reason: SuspensionReason,
    suspendedAt: Date
  ) {
    return createSuspensionNotificationTemplate(projectName, orgName, reason, suspendedAt)
  }

  /**
   * Format suspension notification email
   */
  static formatSuspensionEmail(template: ReturnType<typeof createSuspensionNotificationTemplate>) {
    return formatSuspensionNotificationEmail(template)
  }

  /**
   * Create a notification record
   */
  static async create(
    projectId: string,
    type: string,
    priority: string,
    subject: string,
    body: string,
    data: Record<string, unknown>,
    channels: string[]
  ): Promise<string> {
    return createNotification(
      projectId,
      type as any,
      priority as any,
      subject,
      body,
      data,
      channels as any[]
    )
  }

  /**
   * Get notification by ID
   */
  static async get(notificationId: string): Promise<Notification | null> {
    return getNotification(notificationId)
  }

  /**
   * Get notifications for a project
   */
  static async getProjectNotifications(projectId: string, limit?: number): Promise<Notification[]> {
    return getProjectNotifications(projectId, limit)
  }

  /**
   * Retry failed notifications
   */
  static async retryFailed(maxAttempts?: number): Promise<number> {
    return retryFailedNotifications(maxAttempts)
  }
}

/**
 * Notification Preferences Manager - Manages user notification preferences
 */
export class NotificationPreferencesManager {
  /**
   * Get all notification preferences for a user
   */
  static async getAll(userId: string, projectId?: string) {
    return getNotificationPreferences(userId, projectId)
  }

  /**
   * Get a specific notification preference
   */
  static async get(userId: string, notificationType: string, projectId?: string) {
    return getNotificationPreference(userId, notificationType as any, projectId)
  }

  /**
   * Create or update a notification preference
   */
  static async set(
    userId: string,
    notificationType: string,
    enabled: boolean,
    channels: string[],
    projectId?: string
  ): Promise<string> {
    return upsertNotificationPreference(userId, notificationType as any, enabled, channels as any[], projectId)
  }

  /**
   * Set multiple preferences at once
   */
  static async setMany(userId: string, preferences: Array<{
    notification_type: string
    enabled: boolean
    channels: string[]
  }>, projectId?: string): Promise<string[]> {
    const ids: string[] = []

    for (const preference of preferences) {
      const id = await upsertNotificationPreference(
        userId,
        preference.notification_type as any,
        preference.enabled,
        preference.channels as any[],
        projectId
      )
      ids.push(id)
    }

    return ids
  }

  /**
   * Delete a notification preference
   */
  static async delete(userId: string, notificationType: string, projectId?: string): Promise<boolean> {
    return deleteNotificationPreference(userId, notificationType as any, projectId)
  }

  /**
   * Check if user should receive notification
   */
  static async shouldReceive(userId: string, notificationType: string, projectId?: string): Promise<boolean> {
    return shouldReceiveNotification(userId, notificationType as any, projectId)
  }

  /**
   * Get enabled channels for a notification type
   */
  static async getChannels(userId: string, notificationType: string, projectId?: string) {
    return getEnabledChannels(userId, notificationType as any, projectId)
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
  static getDefaults() {
    return getDefaultNotificationPreferences()
  }
}
