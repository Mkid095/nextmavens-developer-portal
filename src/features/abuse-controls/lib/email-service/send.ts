/**
 * Email Service Module - Email Sending Functions
 *
 * Handles email sending using Resend API.
 * Provides functions to send transactional emails for suspension notifications.
 *
 * Security measures:
 * - API key stored in environment variables only
 * - Email validation using Zod schema
 * - Input sanitization to prevent email injection
 * - Rate limiting considerations
 * - No sensitive data leakage in error messages
 */

import { getResendClient } from './client'
import { validateEmail, validateSubject, sanitizeEmail, sanitizeSubject, isValidEmail } from './validation'
import type { EmailConfig, EmailSendResult, EmailStatistics } from './types'

/**
 * Send an email using Resend
 *
 * SECURITY:
 * - Validates all email addresses using Zod schema
 * - Sanitizes inputs to prevent injection attacks
 * - Never logs sensitive data (API keys, full email content)
 * - Returns generic error messages to clients
 *
 * @param config - Email configuration
 * @returns Send result
 */
export async function sendEmail(config: EmailConfig): Promise<EmailSendResult> {
  const resend = getResendClient()

  if (!resend) {
    console.error('[EmailService] Email service not configured')
    return {
      success: false,
      error: 'Email service not configured',
    }
  }

  try {
    // Validate and sanitize email addresses
    const toValidation = validateEmail(config.to)
    if (!toValidation.success) {
      console.error('[EmailService] Invalid recipient email:', toValidation.error)
      return {
        success: false,
        error: 'Invalid recipient email address',
      }
    }

    const fromValidation = validateEmail(config.from)
    if (!fromValidation.success) {
      console.error('[EmailService] Invalid sender email:', fromValidation.error)
      return {
        success: false,
        error: 'Invalid sender email address',
      }
    }

    // Validate and sanitize subject
    const subjectValidation = validateSubject(config.subject)
    if (!subjectValidation.success) {
      console.error('[EmailService] Invalid subject:', subjectValidation.error)
      return {
        success: false,
        error: 'Invalid subject line',
      }
    }

    const sanitizedTo = sanitizeEmail(toValidation.data!)
    const sanitizedFrom = sanitizeEmail(fromValidation.data!)
    const sanitizedSubject = sanitizeSubject(subjectValidation.data!)

    console.log(`[EmailService] Sending email to ${sanitizedTo.slice(0, 3)}***`)

    // Use type assertion to handle Resend's complex types
    const result = await resend.emails.send({
      from: sanitizedFrom,
      to: sanitizedTo,
      subject: sanitizedSubject,
      ...(config.text && { text: config.text }),
      ...(config.html && { html: config.html }),
      ...(config.replyTo && { replyTo: config.replyTo }),
    } as any)

    if (result.error) {
      console.error('[EmailService] Error sending email:', result.error.message)
      // Don't leak detailed error information to client
      return {
        success: false,
        error: 'Failed to send email',
      }
    }

    console.log(`[EmailService] Email sent successfully, ID: ${result.data?.id}`)
    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    console.error('[EmailService] Unexpected error sending email:', error)
    // Return generic error message - don't leak internal details
    return {
      success: false,
      error: 'Failed to send email',
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
 * Batch send emails to multiple recipients
 *
 * SECURITY:
 * - Validates all email addresses before sending
 * - Adds delay between sends to avoid rate limiting
 * - Never logs sensitive email content
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
    // Validate email using Zod schema
    if (!isValidEmail(recipient)) {
      console.warn(`[EmailService] Invalid email address: ${recipient.slice(0, 3)}***`)
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
    // This helps prevent hitting Resend's rate limits
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
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
