/**
 * Email Service Library for Control Plane API
 *
 * Handles email sending using Resend API.
 * Provides functions to send organization invitation emails.
 */

import { Resend } from 'resend'
import { z } from 'zod'

/**
 * Email validation schema using Zod
 */
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email address too long')
  .refine(
    (email) => {
      // Additional security checks
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
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY not configured, email sending disabled')
    return null
  }

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
 */
function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Sanitize subject line to prevent header injection
 */
function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]/g, ' ').trim()
}

/**
 * Send an email using Resend
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

    const result = await resend.emails.send({
      from: sanitizedFrom,
      to: sanitizedTo,
      subject: sanitizedSubject,
      ...(config.text && { text: config.text }),
      ...(config.html && { html: config.html }),
    } as any)

    if (result.error) {
      console.error('[EmailService] Error sending email:', result.error.message)
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
    return {
      success: false,
      error: 'Failed to send email',
    }
  }
}

/**
 * Organization invitation email data
 */
export interface OrganizationInvitationData {
  /** Recipient email address */
  to: string
  /** Organization name */
  organizationName: string
  /** Inviter's name */
  inviterName: string
  /** Role being invited for */
  role: string
  /** Invitation token */
  token: string
  /** Expiration date */
  expiresAt: Date
}

/**
 * Send organization invitation email
 *
 * Creates and sends an invitation email with a secure token link
 * for joining an organization.
 *
 * @param data - Invitation data
 * @returns Send result
 */
export async function sendOrganizationInvitationEmail(
  data: OrganizationInvitationData
): Promise<EmailSendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  const acceptUrl = `${appUrl}/invite/${data.token}`

  const invitationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to join ${data.organizationName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hello,</p>
        <p><strong>${data.inviterName}</strong> has invited you to join the <strong>${data.organizationName}</strong> organization as a <strong>${data.role}</strong>.</p>
        <p>Click the button below to accept this invitation and join the team:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${acceptUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;"><strong>This invitation expires on ${data.expiresAt.toLocaleDateString()}.</strong></p>
        <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>NextMavens Developer Portal</p>
      </div>
    </body>
    </html>
  `

  const invitationText = `
You're invited to join ${data.organizationName}

${data.inviterName} has invited you to join the ${data.organizationName} organization as a ${data.role}.

To accept this invitation, visit:
${acceptUrl}

This invitation expires on ${data.expiresAt.toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.
  `

  return sendEmail({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@nextmavens.com',
    to: data.to,
    subject: `You're invited to join ${data.organizationName}`,
    text: invitationText,
    html: invitationHtml,
  })
}

/**
 * Validate email address format using Zod schema
 */
export function isValidEmail(email: string): boolean {
  const result = emailSchema.safeParse(email)
  return result.success
}
