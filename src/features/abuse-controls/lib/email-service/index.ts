/**
 * Email Service Module
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

export * from './types'
export { sendEmail, sendPlainTextEmail, sendHtmlEmail, sendBatchEmails, calculateEmailStatistics } from './send'
export { isValidEmail, sanitizeEmail, sanitizeSubject } from './validation'
export { getResendClient } from './client'
