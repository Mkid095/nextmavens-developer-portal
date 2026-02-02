/**
 * Email Service Library
 * @deprecated Re-exports from email-service module for backward compatibility
 * Import from './email-service' instead
 *
 * Handles email sending using Resend API.
 * Provides functions to send transactional emails for suspension notifications.
 */

export * from './email-service/types'
export { sendEmail, sendPlainTextEmail, sendHtmlEmail, sendBatchEmails, calculateEmailStatistics } from './email-service/send'
export { isValidEmail, sanitizeEmail, sanitizeSubject } from './email-service/validation'
export { getResendClient } from './email-service/client'
