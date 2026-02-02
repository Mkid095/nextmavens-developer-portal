/**
 * Session Created Notification Templates
 *
 * HTML and plain text email templates for session created notifications.
 *
 * US-012: Add Break Glass Notifications
 */

import { SUPPORT_EMAIL } from '@/features/abuse-controls/lib/config';

/**
 * Template parameters for session created notification
 */
export interface SessionCreatedTemplateParams {
  adminEmail: string;
  adminId: string;
  sessionId: string;
  reason: string;
  accessMethodDisplay: string;
  expiresAtFormatted: string;
  ipAddress?: string;
}

/**
 * Build HTML email template for session created notification
 *
 * @param params - Template parameters
 * @returns HTML email body
 */
export function buildSessionCreatedHtmlTemplate(params: SessionCreatedTemplateParams): string {
  const {
    adminEmail,
    adminId,
    sessionId,
    reason,
    accessMethodDisplay,
    expiresAtFormatted,
    ipAddress,
  } = params;

  return `
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
}

/**
 * Build plain text email template for session created notification
 *
 * @param params - Template parameters
 * @returns Plain text email body
 */
export function buildSessionCreatedPlainTextTemplate(params: SessionCreatedTemplateParams): string {
  const {
    adminEmail,
    adminId,
    sessionId,
    reason,
    accessMethodDisplay,
    expiresAtFormatted,
    ipAddress,
  } = params;

  return `
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
}
