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

import { sendHtmlEmail, type EmailSendResult } from '@/features/abuse-controls/lib/email-service';
import { SUPPORT_EMAIL, SUPPORT_URL } from '@/features/abuse-controls/lib/config';

/**
 * Platform owner email addresses (from environment variable)
 * Comma-separated list of emails that should receive break glass notifications
 */
const BREAK_GLASS_NOTIFICATION_EMAILS = process.env.BREAK_GLASS_NOTIFICATION_EMAILS
  ? process.env.BREAK_GLASS_NOTIFICATION_EMAILS.split(',').map(e => e.trim())
  : [];

/**
 * Get list of platform owner emails to notify
 *
 * @returns Array of email addresses
 */
function getNotificationRecipients(): string[] {
  // Always include configured platform owner emails
  const recipients = [...BREAK_GLASS_NOTIFICATION_EMAILS];

  // If no recipients configured, use support email as fallback
  if (recipients.length === 0) {
    console.warn('[BreakGlassNotifications] No BREAK_GLASS_NOTIFICATION_EMAILS configured, using support email');
    recipients.push(SUPPORT_EMAIL);
  }

  return recipients;
}

/**
 * Break glass session created notification parameters
 */
export interface BreakGlassSessionCreatedParams {
  /** Admin email address who initiated the session */
  adminEmail: string;
  /** Admin developer ID */
  adminId: string;
  /** Break glass session ID */
  sessionId: string;
  /** Reason provided for break glass access */
  reason: string;
  /** Access method used (hardware_key, otp, emergency_code) */
  accessMethod: string;
  /** When the session expires */
  expiresAt: Date;
  /** IP address of the admin (optional) */
  ipAddress?: string;
}

/**
 * Break glass action notification parameters
 */
export interface BreakGlassActionParams {
  /** Admin email address who performed the action */
  adminEmail: string;
  /** Admin developer ID */
  adminId: string;
  /** Break glass session ID */
  sessionId: string;
  /** Reason from the session */
  sessionReason: string;
  /** Action performed (unlock_project, override_suspension, etc.) */
  action: string;
  /** Target type (project, api_key, etc.) */
  targetType: string;
  /** Target ID */
  targetId: string;
  /** State before the action */
  beforeState: Record<string, unknown>;
  /** State after the action */
  afterState: Record<string, unknown>;
  /** IP address of the admin (optional) */
  ipAddress?: string;
}

/**
 * Format access method for display
 */
function formatAccessMethod(accessMethod: string): string {
  const displayNames: Record<string, string> = {
    'hardware_key': 'Hardware Key (Security Key)',
    'otp': 'OTP / 2FA Code',
    'emergency_code': 'Emergency Code',
  };
  return displayNames[accessMethod] || accessMethod;
}

/**
 * Format action for display
 */
function formatAction(action: string): string {
  const displayNames: Record<string, string> = {
    'unlock_project': 'Unlocked Suspended Project',
    'override_suspension': 'Overrode Auto-Suspension',
    'force_delete': 'Force Deleted Project',
    'regenerate_keys': 'Regenerated System Keys',
    'access_project': 'Accessed Project Details',
    'override_quota': 'Overrode Quota Limit',
    'emergency_action': 'Emergency Action',
  };
  return displayNames[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format target type for display
 */
function formatTargetType(targetType: string): string {
  const displayNames: Record<string, string> = {
    'project': 'Project',
    'api_key': 'API Key',
    'developer': 'Developer',
    'suspension': 'Suspension',
    'quota': 'Quota',
    'system': 'System',
  };
  return displayNames[targetType] || targetType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

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
  const {
    adminEmail,
    adminId,
    sessionId,
    reason,
    accessMethod,
    expiresAt,
    ipAddress,
  } = params;

  const recipients = getNotificationRecipients();

  console.log(
    `[BreakGlassNotifications] Sending session created notification to ${recipients.length} recipient(s)`
  );

  const expiresAtFormatted = expiresAt.toLocaleString();
  const accessMethodDisplay = formatAccessMethod(accessMethod);

  const subject = `[ALERT] Break Glass Session Created by ${adminEmail}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d93025;">Break Glass Session Initiated</h2>

      <div style="background-color: #fce8e6; padding: 15px; border-left: 4px solid #d93025; margin: 20px 0;">
        <p style="margin: 0;"><strong>An admin has initiated emergency access to the platform.</strong></p>
      </div>

      <h3>Session Details</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 150px;">Admin Email:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${adminEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Admin ID:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${adminId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Session ID:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 12px;">${sessionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Access Method:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${accessMethodDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Session Expires:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${expiresAtFormatted}</td>
        </tr>
        ${ipAddress ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">IP Address:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${ipAddress}</td>
        </tr>
        ` : ''}
      </table>

      <h3>Reason for Access</h3>
      <p style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; font-style: italic;">${reason}</p>

      <h3>What This Means</h3>
      <p>This admin now has elevated privileges to perform emergency actions on the platform for the next hour.</p>

      <p><strong>Possible actions include:</strong></p>
      <ul>
        <li>Unlocking suspended projects</li>
        <li>Overriding auto-suspensions</li>
        <li>Force deleting projects</li>
        <li>Regenerating system keys</li>
        <li>Accessing any project details</li>
      </ul>

      <p style="background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107;">
        <strong>All actions performed during this session will be logged with full audit trail.</strong>
      </p>

      <h3>Next Steps</h3>
      <ol>
        <li>Monitor the audit logs for any actions performed during this session</li>
        <li>Review the session details in the admin dashboard</li>
        <li>Follow up with the admin if you have questions about their access</li>
      </ol>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Session ID: <span style="font-family: monospace;">${sessionId}</span><br>
        Expires: ${expiresAtFormatted}
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

      <p style="color: #999; font-size: 12px;">
        This is an automated notification from the NextMavens Developer Portal.<br>
        If you believe this is unauthorized access, please contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> immediately.
      </p>
    </div>
  `.trim();

  const plainText = `
BREAK GLASS SESSION INITIATED

An admin has initiated emergency access to the platform.

Session Details:
- Admin Email: ${adminEmail}
- Admin ID: ${adminId}
- Session ID: ${sessionId}
- Access Method: ${accessMethodDisplay}
- Session Expires: ${expiresAtFormatted}
${ipAddress ? `- IP Address: ${ipAddress}` : ''}

Reason for Access:
${reason}

What This Means:
This admin now has elevated privileges to perform emergency actions on the platform for the next hour.

Possible actions include:
- Unlocking suspended projects
- Overriding auto-suspensions
- Force deleting projects
- Regenerating system keys
- Accessing any project details

All actions performed during this session will be logged with full audit trail.

Next Steps:
1. Monitor the audit logs for any actions performed during this session
2. Review the session details in the admin dashboard
3. Follow up with the admin if you have questions about their access

Session ID: ${sessionId}
Expires: ${expiresAtFormatted}

---
This is an automated notification from the NextMavens Developer Portal.
If you believe this is unauthorized access, please contact ${SUPPORT_EMAIL} immediately.
  `.trim();

  // Send emails to all recipients
  const results: EmailSendResult[] = [];
  for (const recipient of recipients) {
    const result = await sendHtmlEmail(recipient, subject, body, plainText);
    results.push(result);

    // Add a small delay between sends to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Check if all emails were sent successfully
  const failedCount = results.filter((r) => !r.success).length;
  if (failedCount > 0) {
    const errorMessages = results
      .filter((r) => r.error)
      .map((r) => r.error)
      .join('; ');
    console.error(
      `[BreakGlassNotifications] Failed to send ${failedCount} notification(s): ${errorMessages}`
    );
    throw new Error(`Failed to send break glass session notification: ${errorMessages}`);
  }

  console.log(
    `[BreakGlassNotifications] Successfully sent session created notification to ${results.length} recipient(s)`
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
  const {
    adminEmail,
    adminId,
    sessionId,
    sessionReason,
    action,
    targetType,
    targetId,
    beforeState,
    afterState,
    ipAddress,
  } = params;

  const recipients = getNotificationRecipients();

  console.log(
    `[BreakGlassNotifications] Sending action notification to ${recipients.length} recipient(s)`
  );

  const actionDisplay = formatAction(action);
  const targetTypeDisplay = formatTargetType(targetType);
  const timestamp = new Date().toLocaleString();

  const subject = `[ALERT] Break Glass Action Performed: ${actionDisplay}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d93025;">Break Glass Action Performed</h2>

      <div style="background-color: #fce8e6; padding: 15px; border-left: 4px solid #d93025; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>${actionDisplay}</strong></p>
      </div>

      <h3>Action Details</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 150px;">Admin Email:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${adminEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Admin ID:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${adminId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Session ID:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 12px;">${sessionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Action:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${actionDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Target Type:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${targetTypeDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Target ID:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 12px;">${targetId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Timestamp:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td>
        </tr>
        ${ipAddress ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">IP Address:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${ipAddress}</td>
        </tr>
        ` : ''}
      </table>

      <h3>Session Reason</h3>
      <p style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; font-style: italic;">${sessionReason}</p>

      <h3>State Change</h3>
      <table style="border-collapse: collapse; width: 100%; margin: 15px 0;">
        <tr>
          <td style="padding: 10px; background-color: #f8f9fa; border: 1px solid #ddd; font-weight: bold; width: 50%;">Before State</td>
          <td style="padding: 10px; background-color: #e8f5e9; border: 1px solid #ddd; font-weight: bold; width: 50%;">After State</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${JSON.stringify(beforeState, null, 2)}</td>
          <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${JSON.stringify(afterState, null, 2)}</td>
        </tr>
      </table>

      <p style="background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107;">
        <strong>This action has been logged to the audit trail.</strong><br>
        You can review the full audit history in the admin dashboard.
      </p>

      <h3>Review This Action</h3>
      <ol>
        <li>Verify that this action was appropriate</li>
        <li>Check the audit logs for full context</li>
        <li>Follow up with the admin if you have questions</li>
      </ol>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Session ID: <span style="font-family: monospace;">${sessionId}</span><br>
        Timestamp: ${timestamp}
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

      <p style="color: #999; font-size: 12px;">
        This is an automated notification from the NextMavens Developer Portal.<br>
        If you believe this is an unauthorized action, please contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> immediately.
      </p>
    </div>
  `.trim();

  const plainText = `
BREAK GLASS ACTION PERFORMED

${actionDisplay.toUpperCase()}

Action Details:
- Admin Email: ${adminEmail}
- Admin ID: ${adminId}
- Session ID: ${sessionId}
- Action: ${actionDisplay}
- Target Type: ${targetTypeDisplay}
- Target ID: ${targetId}
- Timestamp: ${timestamp}
${ipAddress ? `- IP Address: ${ipAddress}` : ''}

Session Reason:
${sessionReason}

State Change:
Before State:
${JSON.stringify(beforeState, null, 2)}

After State:
${JSON.stringify(afterState, null, 2)}

This action has been logged to the audit trail.
You can review the full audit history in the admin dashboard.

Review This Action:
1. Verify that this action was appropriate
2. Check the audit logs for full context
3. Follow up with the admin if you have questions

Session ID: ${sessionId}
Timestamp: ${timestamp}

---
This is an automated notification from the NextMavens Developer Portal.
If you believe this is an unauthorized action, please contact ${SUPPORT_EMAIL} immediately.
  `.trim();

  // Send emails to all recipients
  const results: EmailSendResult[] = [];
  for (const recipient of recipients) {
    const result = await sendHtmlEmail(recipient, subject, body, plainText);
    results.push(result);

    // Add a small delay between sends to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Check if all emails were sent successfully
  const failedCount = results.filter((r) => !r.success).length;
  if (failedCount > 0) {
    const errorMessages = results
      .filter((r) => r.error)
      .map((r) => r.error)
      .join('; ');
    console.error(
      `[BreakGlassNotifications] Failed to send ${failedCount} notification(s): ${errorMessages}`
    );
    throw new Error(`Failed to send break glass action notification: ${errorMessages}`);
  }

  console.log(
    `[BreakGlassNotifications] Successfully sent action notification to ${results.length} recipient(s)`
  );
}
