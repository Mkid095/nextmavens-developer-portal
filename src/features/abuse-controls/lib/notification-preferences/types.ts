/**
 * Notification Preferences Module - Type Definitions
 */

import type {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../../types'

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

export type { NotificationType, NotificationChannel, NotificationPriority }
