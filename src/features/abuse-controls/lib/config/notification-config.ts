/**
 * Notification Configuration Module
 * Configuration for suspension notifications
 */

/**
 * Support email address for suspension notifications
 */
export const SUPPORT_EMAIL = 'support@example.com'

/**
 * Support URL for suspension help and documentation
 */
export const SUPPORT_URL = 'https://example.com/support/suspensions'

/**
 * Email service configuration
 */
export const EMAIL_CONFIG = {
  /** Resend API key (from environment variable) */
  apiKey: process.env.RESEND_API_KEY || '',
  /** Default sender email address */
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
  /** Support contact email */
  supportEmail: process.env.SUPPORT_EMAIL || SUPPORT_EMAIL,
  /** Support URL for documentation */
  supportUrl: process.env.SUPPORT_URL || SUPPORT_URL,
} as const

/**
 * Validate email configuration
 *
 * @returns Whether the email configuration is valid
 * @returns Error message if invalid
 */
export function validateEmailConfig(): { valid: boolean; error?: string } {
  if (!EMAIL_CONFIG.apiKey) {
    return {
      valid: false,
      error: 'RESEND_API_KEY environment variable is not set',
    }
  }

  if (!EMAIL_CONFIG.fromEmail || EMAIL_CONFIG.fromEmail === 'noreply@example.com') {
    return {
      valid: false,
      error: 'RESEND_FROM_EMAIL environment variable is not set or using default',
    }
  }

  return { valid: true }
}

/**
 * Suspension notification email template
 */
export interface SuspensionNotificationTemplate {
  /** Email subject line */
  subject: string
  /** Email body content */
  body: string
  /** Plain text version */
  plainText: string
}

/**
 * Default suspension notification template
 */
export function getDefaultSuspensionNotificationTemplate(
  projectName: string,
  orgName: string,
  capExceeded: string,
  currentUsage: number,
  limit: number
): SuspensionNotificationTemplate {
  const subject = `[URGENT] Project "${projectName}" Suspended - ${orgName}`

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d93025;">Important: Your Project Has Been Suspended</h2>

      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Organization:</strong> ${orgName}</p>
      <p><strong>Suspended At:</strong> ${new Date().toLocaleString()}</p>

      <div style="background-color: #fce8e6; padding: 15px; border-left: 4px solid #d93025; margin: 20px 0;">
        <p style="margin: 0;"><strong>Reason:</strong> Exceeded ${capExceeded} limit</p>
      </div>

      <h3>Violation Details</h3>
      <ul>
        <li><strong>Limit Exceeded:</strong> ${capExceeded}</li>
        <li><strong>Current Usage:</strong> ${currentUsage.toLocaleString()}</li>
        <li><strong>Limit:</strong> ${limit.toLocaleString()}</li>
      </ul>

      <h3>What Happened</h3>
      <p>Your project has exceeded its hard cap for ${capExceeded}. To protect the platform and other users, the project has been automatically suspended.</p>

      <h3>How to Resolve This Issue</h3>
      <ol>
        <li>Review your usage metrics in the developer dashboard</li>
        <li>Identify the source of the exceeded limit</li>
        <li>Optimize your application to reduce usage</li>
        <li>Consider upgrading your plan if needed</li>
        <li>Contact support for assistance</li>
      </ol>

      <p style="background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
        <strong>Need Help?</strong><br>
        If you believe this suspension is in error or need assistance resolving this issue,
        please contact our support team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        or visit <a href="${SUPPORT_URL}">${SUPPORT_URL}</a>.
      </p>

      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Please include your project ID and organization name in your correspondence.
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

      <p style="color: #999; font-size: 12px;">
        This is an automated notification. Please do not reply directly to this email.
      </p>
    </div>
  `.trim()

  const plainText = `
IMPORTANT: Your project has been suspended

Project: ${projectName}
Organization: ${orgName}
Suspended At: ${new Date().toLocaleString()}
Reason: Exceeded ${capExceeded} limit

Violation Details:
- Limit Exceeded: ${capExceeded}
- Current Usage: ${currentUsage.toLocaleString()}
- Limit: ${limit.toLocaleString()}

What Happened:
Your project has exceeded its hard cap for ${capExceeded}. To protect the platform
and other users, the project has been automatically suspended.

How to Resolve This Issue:
1. Review your usage metrics in the developer dashboard
2. Identify the source of the exceeded limit
3. Optimize your application to reduce usage
4. Consider upgrading your plan if needed
5. Contact support for assistance

Need Help?
If you believe this suspension is in error or need assistance resolving this issue,
please contact our support team at ${SUPPORT_EMAIL} or visit ${SUPPORT_URL}.

Please include your project ID and organization name in your correspondence.

---
This is an automated notification. Please do not reply directly to this email.
  `.trim()

  return { subject, body, plainText }
}
