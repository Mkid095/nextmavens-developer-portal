/**
 * Action Performed Notification Templates
 *
 * HTML and plain text email templates for action performed notifications.
 *
 * US-012: Add Break Glass Notifications
 */

import { SUPPORT_EMAIL } from '@/features/abuse-controls/lib/config';

/**
 * Template parameters for action performed notification
 */
export interface ActionPerformedTemplateParams {
  actionDisplay: string;
  adminEmail: string;
  adminId: string;
  sessionId: string;
  targetTypeDisplay: string;
  targetId: string;
  sessionReason: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
}

/**
 * Build HTML email template for action performed notification
 *
 * @param params - Template parameters
 * @returns HTML email body
 */
export function buildActionPerformedHtmlTemplate(params: ActionPerformedTemplateParams): string {
  const {
    actionDisplay,
    adminEmail,
    adminId,
    sessionId,
    targetTypeDisplay,
    targetId,
    sessionReason,
    beforeState,
    afterState,
    timestamp,
    ipAddress,
  } = params;

  return `
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
}

/**
 * Build plain text email template for action performed notification
 *
 * @param params - Template parameters
 * @returns Plain text email body
 */
export function buildActionPerformedPlainTextTemplate(params: ActionPerformedTemplateParams): string {
  const {
    actionDisplay,
    adminEmail,
    adminId,
    sessionId,
    targetTypeDisplay,
    targetId,
    sessionReason,
    beforeState,
    afterState,
    timestamp,
    ipAddress,
  } = params;

  return `
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
}
