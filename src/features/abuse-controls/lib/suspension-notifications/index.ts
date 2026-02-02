/**
 * Suspension Notifications Module
 *
 * Manages suspension-specific notifications for projects that exceed hard caps.
 * Provides functions to send, track, and manage suspension notifications.
 */

export * from './types'
export { sendSuspensionNotification } from './send'
export {
  getPendingNotifications,
  markNotificationSent,
  markNotificationFailed,
  getProjectSuspensionNotifications,
  getSuspensionNotification,
} from './queries'
