/**
 * Email Service Library
 *
 * Handles email sending using Resend API.
 * Provides functions to send transactional emails for suspension notifications.
 */

import { Resend } from 'resend'

/**
 * Get Resend client instance
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY not configured, email sending disabled')
    return null
  }

  return new Resend(apiKey)
}

/**
 * Email configuration
 */
export interface EmailConfig {
  /** Sender email address */
  from: string
  /** Recipient email address */
  to: string
  /** Email subject */
  subject: string
  /** Plain text body */
  text?: string
  /** HTML body */
  html?: string
  /** Reply-to email address */
  replyTo?: string
}

/**
 * Email send result
 */
export interface EmailSendResult {
  /** Whether the email was sent successfully */
  success: boolean
  /** Resend message ID if successful */
  messageId?: string
  /** Error message if failed */
  error?: string
}

/**
 * Send an email using Resend
 *
 * @param config - Email configuration
 * @returns Send result
 */
export async function sendEmail(config: EmailConfig): Promise<EmailSendResult> {
  const resend = getResendClient()

  if (!resend) {
    console.error('[EmailService] Resend client not configured')
    return {
      success: false,
      error: 'Email service not configured',
    }
  }

  try {
    console.log(`[EmailService] Sending email to ${config.to}`)

    // Use type assertion to handle Resend's complex types
    const result = await resend.emails.send({
      from: config.from,
      to: config.to,
      subject: config.subject,
      ...(config.text && { text: config.text }),
      ...(config.html && { html: config.html }),
      ...(config.replyTo && { replyTo: config.replyTo }),
    } as any)

    if (result.error) {
      console.error('[EmailService] Error sending email:', result.error)
      return {
        success: false,
        error: result.error.message,
      }
    }

    console.log(`[EmailService] Email sent successfully, ID: ${result.data?.id}`)
    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    console.error('[EmailService] Unexpected error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send a plain text email
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text body
 * @param from - Sender email address (optional, uses default if not provided)
 * @returns Send result
 */
export async function sendPlainTextEmail(
  to: string,
  subject: string,
  text: string,
  from?: string
): Promise<EmailSendResult> {
  const defaultFrom = process.env.RESEND_FROM_EMAIL || 'noreply@example.com'

  return sendEmail({
    from: from || defaultFrom,
    to,
    subject,
    text,
  })
}

/**
 * Send an HTML email
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML body
 * @param text - Plain text fallback (optional)
 * @param from - Sender email address (optional, uses default if not provided)
 * @returns Send result
 */
export async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
  from?: string
): Promise<EmailSendResult> {
  const defaultFrom = process.env.RESEND_FROM_EMAIL || 'noreply@example.com'

  return sendEmail({
    from: from || defaultFrom,
    to,
    subject,
    html,
    text,
  })
}

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Batch send emails to multiple recipients
 *
 * @param recipients - Array of email addresses
 * @param subject - Email subject
 * @param text - Plain text body
 * @param html - HTML body (optional)
 * @param from - Sender email address (optional)
 * @returns Array of send results
 */
export async function sendBatchEmails(
  recipients: string[],
  subject: string,
  text: string,
  html?: string,
  from?: string
): Promise<EmailSendResult[]> {
  const results: EmailSendResult[] = []

  for (const recipient of recipients) {
    if (!isValidEmail(recipient)) {
      console.warn(`[EmailService] Invalid email address: ${recipient}`)
      results.push({
        success: false,
        error: 'Invalid email address',
      })
      continue
    }

    const result = await sendEmail({
      from: from || process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: recipient,
      subject,
      text,
      html,
    })

    results.push(result)

    // Add a small delay between sends to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
}

/**
 * Get email statistics (placeholder for future analytics)
 */
export interface EmailStatistics {
  totalSent: number
  totalFailed: number
  successRate: number
}

/**
 * Calculate email statistics from send results
 *
 * @param results - Array of send results
 * @returns Email statistics
 */
export function calculateEmailStatistics(results: EmailSendResult[]): EmailStatistics {
  const totalSent = results.length
  const totalFailed = results.filter((r) => !r.success).length
  const successRate = totalSent > 0 ? (totalSent - totalFailed) / totalSent : 0

  return {
    totalSent,
    totalFailed,
    successRate,
  }
}
