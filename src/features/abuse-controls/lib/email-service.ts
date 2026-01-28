/**
 * Email Service Library
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

import { Resend } from 'resend'
import { z } from 'zod'

/**
 * Email validation schema using Zod
 * - Must be valid email format
 * - Max length 255 characters
 * - Prevents email injection attacks
 */
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email address too long')
  .refine(
    (email) => {
      // Additional security checks
      // Prevent email injection through newlines or special characters
      const hasNewlines = /\r|\n/.test(email)
      const hasMultipleAt = (email.match(/@/g) || []).length > 1
      const hasSuspiciousChars = /[;,<>"]/.test(email)

      return !hasNewlines && !hasMultipleAt && !hasSuspiciousChars
    },
    {
      message: 'Email contains invalid characters',
    }
  )

/**
 * Subject line validation schema
 * - Prevents email header injection
 * - Max length 500 characters
 */
const subjectSchema = z
  .string()
  .max(500, 'Subject too long')
  .refine(
    (subject) => !/\r|\n/.test(subject),
    { message: 'Subject cannot contain newlines' }
  )

/**
 * Get Resend client instance
 *
 * SECURITY: API key is loaded from environment variable only.
 * Never hardcode API keys in source code.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY not configured, email sending disabled')
    return null
  }

  // Validate API key format (basic check)
  if (apiKey.length < 10) {
    console.error('[EmailService] RESEND_API_KEY appears to be invalid (too short)')
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
 * Sanitize email address to prevent injection attacks
 *
 * @param email - Email address to sanitize
 * @returns Sanitized email address
 */
function sanitizeEmail(email: string): string {
  // Trim whitespace
  return email.trim().toLowerCase()
}

/**
 * Sanitize subject line to prevent header injection
 *
 * @param subject - Subject line to sanitize
 * @returns Sanitized subject line
 */
function sanitizeSubject(subject: string): string {
  // Remove any newlines or carriage returns
  return subject.replace(/[\r\n]/g, ' ').trim()
}

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
    const toValidation = emailSchema.safeParse(config.to)
    if (!toValidation.success) {
      const errorMessage = toValidation.error.issues[0]?.message || 'Invalid format'
      console.error('[EmailService] Invalid recipient email:', errorMessage)
      return {
        success: false,
        error: 'Invalid recipient email address',
      }
    }

    const fromValidation = emailSchema.safeParse(config.from)
    if (!fromValidation.success) {
      const errorMessage = fromValidation.error.issues[0]?.message || 'Invalid format'
      console.error('[EmailService] Invalid sender email:', errorMessage)
      return {
        success: false,
        error: 'Invalid sender email address',
      }
    }

    // Validate and sanitize subject
    const subjectValidation = subjectSchema.safeParse(config.subject)
    if (!subjectValidation.success) {
      const errorMessage = subjectValidation.error.issues[0]?.message || 'Invalid format'
      console.error('[EmailService] Invalid subject:', errorMessage)
      return {
        success: false,
        error: 'Invalid subject line',
      }
    }

    const sanitizedTo = sanitizeEmail(toValidation.data)
    const sanitizedFrom = sanitizeEmail(fromValidation.data)
    const sanitizedSubject = sanitizeSubject(subjectValidation.data)

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
 * Validate email address format using Zod schema
 *
 * SECURITY: Uses Zod validation instead of simple regex
 * - Prevents email injection attacks
 * - Validates format and length
 * - Checks for suspicious characters
 *
 * @param email - Email address to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const result = emailSchema.safeParse(email)
  return result.success
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
