/**
 * Quota Reset Notifications
 *
 * Handles email notifications for quota resets.
 * US-008: Implement Quota Reset
 */

import { sendHtmlEmail } from '@/features/abuse-controls/lib/email-service'
import type { QuotaToReset } from '../quota-reset-job'

/**
 * Notification result interface
 */
export interface NotificationResult {
  success: boolean
  error?: string
}

/**
 * Send quota reset notification email to project owner
 *
 * @param projectName - Project name
 * @param service - Service being reset
 * @param monthlyLimit - Monthly quota limit
 * @param nextResetDate - Next reset date
 * @param ownerEmail - Project owner's email
 * @returns Success status and optional error message
 */
export async function sendQuotaResetNotification(
  projectName: string,
  service: string,
  monthlyLimit: number,
  nextResetDate: Date,
  ownerEmail: string
): Promise<NotificationResult> {
  const formattedService = service.replace(/_/g, ' ').toUpperCase()
  const formattedDate = nextResetDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const html = generateQuotaResetHtml(projectName, formattedService, monthlyLimit, formattedDate)
  const text = generateQuotaResetText(projectName, formattedService, monthlyLimit, formattedDate)

  try {
    const result = await sendHtmlEmail(
      ownerEmail,
      `Monthly Quota Reset - ${projectName}`,
      html,
      text
    )

    if (result.success) {
      console.log(`[Quota Reset Job] Sent notification to ${ownerEmail.slice(0, 3)}***`)
      return { success: true }
    } else {
      console.error(`[Quota Reset Job] Failed to send notification to ${ownerEmail.slice(0, 3)}***: ${result.error}`)
      return { success: false, error: result.error }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Quota Reset Job] Error sending notification: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

/**
 * Generate HTML email content for quota reset notification
 */
function generateQuotaResetHtml(
  projectName: string,
  formattedService: string,
  monthlyLimit: number,
  formattedDate: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quota Reset - ${projectName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
        .container { background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        h1 { color: #111827; margin-top: 0; font-size: 24px; font-weight: 600; }
        .highlight { background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .info-box { background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin: 20px 0; }
        .label { font-weight: 600; color: #374151; }
        .value { color: #6b7280; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .badge { display: inline-block; background-color: #10b981; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; margin-left: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Quota Reset Complete <span class="badge">MONTHLY</span></h1>

        <p>Hi there,</p>

        <p>Your monthly quota has been reset for project <strong>${projectName}</strong>.</p>

        <div class="highlight">
          <p style="margin: 0;"><strong>${formattedService}</strong> quota has been refreshed and you now have your full monthly allowance of <strong>${monthlyLimit.toLocaleString()}</strong> units available.</p>
        </div>

        <div class="info-box">
          <p class="label">Next Reset Date</p>
          <p class="value">${formattedDate}</p>
        </div>

        <p>You can view your current usage and quota status in your project dashboard.</p>

        <div class="footer">
          <p style="margin: 0;">This is an automated notification. You're receiving this because you're the owner of project <strong>${projectName}</strong>.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text email content for quota reset notification
 */
function generateQuotaResetText(
  projectName: string,
  formattedService: string,
  monthlyLimit: number,
  formattedDate: string
): string {
  return `
    Quota Reset Complete - ${projectName}

    Hi there,

    Your monthly quota has been reset for project "${projectName}".

    ${formattedService} quota has been refreshed and you now have your full monthly allowance of ${monthlyLimit.toLocaleString()} units available.

    Next Reset Date: ${formattedDate}

    You can view your current usage and quota status in your project dashboard.

    ---
    This is an automated notification. You're receiving this because you're the owner of project "${projectName}".
  `
}

/**
 * Send notifications for all reset quotas
 *
 * Groups quotas by project and sends one notification per project.
 *
 * @param quotasReset - Array of quotas that were reset
 * @param quotasByProject - Map of project IDs to their quotas
 * @param getNextResetDate - Function to calculate next reset date
 * @returns Object with sent and failed counts
 */
export async function sendQuotaResetNotifications(
  quotasReset: QuotaToReset[],
  quotasByProject: Map<string, QuotaToReset[]>,
  getNextResetDate: (date: Date) => Date
): Promise<{ sent: number; failed: number }> {
  let notificationsSent = 0
  let notificationsFailed = 0
  const notifiedProjects = new Set<string>()

  for (const quota of quotasReset) {
    if (notifiedProjects.has(quota.projectId)) {
      continue // Already sent notification for this project
    }

    const nextResetDate = getNextResetDate(quota.resetAt)

    // Send notification for the first service of the project
    // (The email summarizes the reset, including the monthly limit)
    const notificationResult = await sendQuotaResetNotification(
      quota.projectName,
      quota.service,
      quota.monthlyLimit,
      nextResetDate,
      quota.ownerEmail
    )

    if (notificationResult.success) {
      notificationsSent++
    } else {
      notificationsFailed++
    }

    notifiedProjects.add(quota.projectId)
  }

  return { sent: notificationsSent, failed: notificationsFailed }
}
