/**
 * Verify Notification Integration - Checks Module - Function Verification
 */

import { verifyModuleFunctions, createSuccessResult, createFailureResult, createErrorResult } from './utils'
import { REQUIRED_NOTIFICATION_FUNCTIONS, REQUIRED_EMAIL_SERVICE_FUNCTIONS, REQUIRED_PREFERENCE_FUNCTIONS } from './constants'
import type { VerificationResult } from '../types'

/**
 * Verify notification functions exist
 */
export async function verifyNotificationFunctions(): Promise<VerificationResult> {
  try {
    const { missing, hasAll } = await verifyModuleFunctions(
      '../notifications',
      REQUIRED_NOTIFICATION_FUNCTIONS
    )

    if (!hasAll) {
      return createFailureResult('Notification Functions', `Missing ${missing.length} required functions`, {
        missing,
      })
    }

    return createSuccessResult(
      'Notification Functions',
      `All ${REQUIRED_NOTIFICATION_FUNCTIONS.length} required functions are exported`,
      { functions: REQUIRED_NOTIFICATION_FUNCTIONS }
    )
  } catch (error) {
    return createErrorResult('Notification Functions', error)
  }
}

/**
 * Verify email service is configured
 */
export async function verifyEmailService(): Promise<VerificationResult> {
  try {
    const { missing, hasAll } = await verifyModuleFunctions(
      '../email-service',
      REQUIRED_EMAIL_SERVICE_FUNCTIONS
    )

    if (!hasAll) {
      return createFailureResult('Email Service', `Missing ${missing.length} required functions`, {
        missing,
      })
    }

    const resendKeyConfigured = !!process.env.RESEND_API_KEY

    return createSuccessResult(
      'Email Service',
      resendKeyConfigured
        ? 'Email service configured with Resend API key'
        : 'Email service available but Resend API key not configured',
      { resendKeyConfigured }
    )
  } catch (error) {
    return createErrorResult('Email Service', error)
  }
}

/**
 * Verify notification preferences
 */
export async function verifyNotificationPreferences(): Promise<VerificationResult> {
  try {
    const { missing, hasAll } = await verifyModuleFunctions(
      '../notification-preferences',
      REQUIRED_PREFERENCE_FUNCTIONS
    )

    if (!hasAll) {
      return createFailureResult('Notification Preferences', `Missing ${missing.length} required functions`, {
        missing,
      })
    }

    return createSuccessResult(
      'Notification Preferences',
      `All ${REQUIRED_PREFERENCE_FUNCTIONS.length} required preference functions are exported`,
      { functions: REQUIRED_PREFERENCE_FUNCTIONS }
    )
  } catch (error) {
    return createErrorResult('Notification Preferences', error)
  }
}
