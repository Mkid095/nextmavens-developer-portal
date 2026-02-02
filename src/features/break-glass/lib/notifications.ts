/**
 * Break Glass Notifications Service
 *
 * Sends email notifications when:
 * 1. A break glass session is created
 * 2. A break glass action is performed
 *
 * US-012: Add Break Glass Notifications
 *
 * @example
 * ```typescript
 * import { sendBreakGlassSessionCreatedNotification, sendBreakGlassActionNotification } from '@/features/break-glass/lib/notifications';
 *
 * // Notify when session is created
 * await sendBreakGlassSessionCreatedNotification({
 *   adminEmail: 'admin@example.com',
 *   adminId: 'admin-123',
 *   sessionId: 'session-456',
 *   reason: 'Need to unlock false positive suspension',
 *   accessMethod: 'otp',
 *   expiresAt: new Date(Date.now() + 3600000),
 * });
 *
 * // Notify when action is performed
 * await sendBreakGlassActionNotification({
 *   adminEmail: 'admin@example.com',
 *   adminId: 'admin-123',
 *   sessionId: 'session-456',
 *   sessionReason: 'Need to unlock false positive suspension',
 *   action: 'unlock_project',
 *   targetType: 'project',
 *   targetId: 'proj-789',
 *   beforeState: { status: 'SUSPENDED' },
 *   afterState: { status: 'ACTIVE' },
 * });
 * ```
 */

// Re-export types from builders
export type {
  BreakGlassSessionCreatedParams,
  BreakGlassActionParams,
} from './builders';

// Re-export utility functions for external use if needed
export {
  getNotificationRecipients,
  formatAccessMethod,
  formatAction,
  formatTargetType,
  formatDate,
} from './utils';

// Import the builders and senders
import {
  buildSessionCreatedNotification,
  buildActionPerformedNotification,
  type BreakGlassSessionCreatedParams,
  type BreakGlassActionParams,
} from './builders';
import {
  sendSessionCreatedNotification,
  sendActionPerformedNotification,
} from './senders';

/**
 * Send notification when a break glass session is created
 *
 * @param params - Session created notification parameters
 * @returns Promise that resolves when notification is sent
 *
 * @example
 * ```typescript
 * await sendBreakGlassSessionCreatedNotification({
 *   adminEmail: 'admin@example.com',
 *   adminId: 'admin-123',
 *   sessionId: 'session-456',
 *   reason: 'Need to unlock false positive suspension',
 *   accessMethod: 'otp',
 *   expiresAt: new Date(Date.now() + 3600000),
 * });
 * ```
 */
export async function sendBreakGlassSessionCreatedNotification(
  params: BreakGlassSessionCreatedParams
): Promise<void> {
  const notification = buildSessionCreatedNotification(params);

  await sendSessionCreatedNotification(
    notification.subject,
    notification.htmlBody,
    notification.plainTextBody
  );
}

/**
 * Send notification when a break glass action is performed
 *
 * @param params - Action notification parameters
 * @returns Promise that resolves when notification is sent
 *
 * @example
 * ```typescript
 * await sendBreakGlassActionNotification({
 *   adminEmail: 'admin@example.com',
 *   adminId: 'admin-123',
 *   sessionId: 'session-456',
 *   sessionReason: 'Need to unlock false positive suspension',
 *   action: 'unlock_project',
 *   targetType: 'project',
 *   targetId: 'proj-789',
 *   beforeState: { status: 'SUSPENDED' },
 *   afterState: { status: 'ACTIVE' },
 * });
 * ```
 */
export async function sendBreakGlassActionNotification(
  params: BreakGlassActionParams
): Promise<void> {
  const notification = buildActionPerformedNotification(params);

  await sendActionPerformedNotification(
    notification.subject,
    notification.htmlBody,
    notification.plainTextBody
  );
}
