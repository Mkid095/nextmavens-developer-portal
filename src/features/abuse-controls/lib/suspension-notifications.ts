/**
 * Suspension Notifications Library
 * @deprecated Re-exports from suspension-notifications module for backward compatibility
 * Import from './suspension-notifications' instead
 *
 * Manages suspension-specific notifications for projects that exceed hard caps.
 */

export * from './suspension-notifications/types'
export { sendSuspensionNotification } from './suspension-notifications/send'
export {
  getPendingNotifications,
  markNotificationSent,
  markNotificationFailed,
  getProjectSuspensionNotifications,
  getSuspensionNotification,
} from './suspension-notifications/queries'
