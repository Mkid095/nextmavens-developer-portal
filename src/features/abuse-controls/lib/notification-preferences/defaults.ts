/**
 * Notification Preferences Module - Default Preferences
 */

import type { NotificationPreferenceInput } from './types'
import type { NotificationType, NotificationChannel } from '../../types'

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
