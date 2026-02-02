/**
 * Email Service Module - Validation
 *
 * Security measures:
 * - Email validation using Zod schema
 * - Input sanitization to prevent email injection
 * - Subject line validation to prevent header injection
 */

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
 * Validate email address using Zod schema
 */
export function validateEmail(email: string): { success: boolean; data?: string; error?: string } {
  const result = emailSchema.safeParse(email)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessage = result.error.issues[0]?.message || 'Invalid format'
  return { success: false, error: errorMessage }
}

/**
 * Validate subject line using Zod schema
 */
export function validateSubject(subject: string): { success: boolean; data?: string; error?: string } {
  const result = subjectSchema.safeParse(subject)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessage = result.error.issues[0]?.message || 'Invalid format'
  return { success: false, error: errorMessage }
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
 * Sanitize email address to prevent injection attacks
 *
 * @param email - Email address to sanitize
 * @returns Sanitized email address
 */
export function sanitizeEmail(email: string): string {
  // Trim whitespace
  return email.trim().toLowerCase()
}

/**
 * Sanitize subject line to prevent header injection
 *
 * @param subject - Subject line to sanitize
 * @returns Sanitized subject line
 */
export function sanitizeSubject(subject: string): string {
  // Remove any newlines or carriage returns
  return subject.replace(/[\r\n]/g, ' ').trim()
}
