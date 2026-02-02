/**
 * Email Service Module - Resend Client
 *
 * SECURITY: API key is loaded from environment variable only.
 * Never hardcode API keys in source code.
 */

import { Resend } from 'resend'

/**
 * Get Resend client instance
 *
 * SECURITY: API key is loaded from environment variable only.
 * Never hardcode API keys in source code.
 */
export function getResendClient(): Resend | null {
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
