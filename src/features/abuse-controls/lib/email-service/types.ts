/**
 * Email Service Module - Type Definitions
 */

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
 * Email statistics (placeholder for future analytics)
 */
export interface EmailStatistics {
  totalSent: number
  totalFailed: number
  successRate: number
}
