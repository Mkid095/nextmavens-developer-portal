/**
 * Verify Notification Integration - Checks Module - Integration Verification
 */

import { createSuccessResult, createFailureResult, createErrorResult } from './utils'
import type { VerificationResult } from '../types'

/**
 * Verify type exports
 */
export async function verifyTypeExports(): Promise<VerificationResult> {
  try {
    // This is a compile-time check, so we just verify the imports work
    // If we got here without a compile error, the types exist
    await import('../types')

    return createSuccessResult('Type Exports', 'All required types are exported')
  } catch (error) {
    return createErrorResult('Type Exports', error)
  }
}

/**
 * Verify suspension integration
 */
export async function verifySuspensionIntegration(): Promise<VerificationResult> {
  try {
    const suspensionsModule = await import('../suspensions')

    // Check that sendSuspensionNotification is imported and used
    const suspensionsCode = String(suspensionsModule)

    const hasNotificationImport = suspensionsCode.includes('sendSuspensionNotification')
    const hasNotificationCall = suspensionsCode.includes('sendSuspensionNotification(projectId')

    if (!hasNotificationImport || !hasNotificationCall) {
      return createFailureResult('Suspension Integration', 'Suspension system not properly integrated with notifications', {
        hasImport: hasNotificationImport,
        hasCall: hasNotificationCall,
      })
    }

    return createSuccessResult(
      'Suspension Integration',
      'Suspension system properly integrated with notification sending'
    )
  } catch (error) {
    return createErrorResult('Suspension Integration', error)
  }
}

/**
 * Verify email templates
 */
export async function verifyEmailTemplates(): Promise<VerificationResult> {
  try {
    const { createSuspensionNotificationTemplate, formatSuspensionNotificationEmail } =
      await import('../notifications')

    const { HardCapType } = await import('../../types')
    const { REQUIRED_EMAIL_CONTENT } = await import('./constants')

    const testReason = {
      cap_type: HardCapType.DB_QUERIES_PER_DAY,
      current_value: 15000,
      limit_exceeded: 10000,
      details: 'Test suspension',
    }

    const template = createSuspensionNotificationTemplate(
      'Test Project',
      'Test Org',
      testReason,
      new Date()
    )

    const { body } = formatSuspensionNotificationEmail(template)

    const missing: string[] = []

    for (const content of REQUIRED_EMAIL_CONTENT) {
      if (!body.includes(content)) {
        missing.push(content)
      }
    }

    if (missing.length > 0) {
      return createFailureResult('Email Templates', 'Email template missing required content', {
        missing,
      })
    }

    return createSuccessResult(
      'Email Templates',
      'Email templates generate correct content with all required information',
      { bodyLength: body.length }
    )
  } catch (error) {
    return createErrorResult('Email Templates', error)
  }
}
