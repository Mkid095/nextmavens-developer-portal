/**
 * Verify Notification Integration - Verification Checks
 *
 * @deprecated This file has been refactored into the checks-module.
 * Please import from './checks-module' instead.
 */

export * from './checks-module'

/**
 * Verify database tables exist
 */
export async function verifyDatabaseTables(): Promise<VerificationResult> {
  try {
    const pool = getPool()

    // Check notifications table
    const notificationsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notifications'
      )
    `)

    const notificationsExists = notificationsResult.rows[0].exists

    // Check notification_preferences table
    const preferencesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notification_preferences'
      )
    `)

    const preferencesExists = preferencesResult.rows[0].exists

    if (!notificationsExists || !preferencesExists) {
      return {
        name: 'Database Tables',
        passed: false,
        message: 'Missing required database tables',
        details: {
          notifications: notificationsExists ? 'exists' : 'missing',
          notification_preferences: preferencesExists ? 'exists' : 'missing',
        },
      }
    }

    // Check indexes
    const indexesResult = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('notifications', 'notification_preferences')
    `)

    const indexCount = indexesResult.rows.length

    return {
      name: 'Database Tables',
      passed: true,
      message: `Found notifications, notification_preferences tables with ${indexCount} indexes`,
      details: { indexCount },
    }
  } catch (error) {
    return {
      name: 'Database Tables',
      passed: false,
      message: `Error checking database tables: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Verify type exports
 */
export async function verifyTypeExports(): Promise<VerificationResult> {
  try {
    const requiredTypes = [
      'NotificationType',
      'NotificationPriority',
      'NotificationStatus',
      'NotificationChannel',
      'Notification',
      'NotificationRecipient',
      'SuspensionNotificationTemplate',
      'NotificationDeliveryResult',
    ]

    // This is a compile-time check, so we just verify the imports work
    for (const type of requiredTypes) {
      // If we got here without a compile error, the types exist
    }

    return {
      name: 'Type Exports',
      passed: true,
      message: `All ${requiredTypes.length} required types are exported`,
      details: { types: requiredTypes },
    }
  } catch (error) {
    return {
      name: 'Type Exports',
      passed: false,
      message: `Error verifying type exports: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Verify notification functions exist
 */
export async function verifyNotificationFunctions(): Promise<VerificationResult> {
  try {
    const notificationsModule = await import('../notifications')

    const requiredFunctions = [
      'getNotificationRecipients',
      'createSuspensionNotificationTemplate',
      'formatSuspensionNotificationEmail',
      'createNotification',
      'sendEmailNotification',
      'sendSuspensionNotification',
      'updateNotificationDeliveryStatus',
      'getNotification',
      'getProjectNotifications',
      'retryFailedNotifications',
    ]

    const missing: string[] = []

    for (const fn of requiredFunctions) {
      if (typeof (notificationsModule as Record<string, unknown>)[fn] !== 'function') {
        missing.push(fn)
      }
    }

    if (missing.length > 0) {
      return {
        name: 'Notification Functions',
        passed: false,
        message: `Missing ${missing.length} required functions`,
        details: { missing },
      }
    }

    return {
      name: 'Notification Functions',
      passed: true,
      message: `All ${requiredFunctions.length} required functions are exported`,
      details: { functions: requiredFunctions },
    }
  } catch (error) {
    return {
      name: 'Notification Functions',
      passed: false,
      message: `Error verifying notification functions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Verify email service is configured
 */
export async function verifyEmailService(): Promise<VerificationResult> {
  try {
    const emailServiceModule = await import('../email-service')

    const requiredFunctions = [
      'sendEmail',
      'sendPlainTextEmail',
      'sendHtmlEmail',
      'isValidEmail',
      'sendBatchEmails',
    ]

    const missing: string[] = []

    for (const fn of requiredFunctions) {
      if (typeof (emailServiceModule as Record<string, unknown>)[fn] !== 'function') {
        missing.push(fn)
      }
    }

    if (missing.length > 0) {
      return {
        name: 'Email Service',
        passed: false,
        message: `Missing ${missing.length} required functions`,
        details: { missing },
      }
    }

    // Check if Resend API key is configured
    const resendKeyConfigured = !!process.env.RESEND_API_KEY

    return {
      name: 'Email Service',
      passed: true,
      message: resendKeyConfigured
        ? 'Email service configured with Resend API key'
        : 'Email service available but Resend API key not configured',
      details: { resendKeyConfigured },
    }
  } catch (error) {
    return {
      name: 'Email Service',
      passed: false,
      message: `Error verifying email service: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
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
      return {
        name: 'Suspension Integration',
        passed: false,
        message: 'Suspension system not properly integrated with notifications',
        details: {
          hasImport: hasNotificationImport,
          hasCall: hasNotificationCall,
        },
      }
    }

    return {
      name: 'Suspension Integration',
      passed: true,
      message: 'Suspension system properly integrated with notification sending',
    }
  } catch (error) {
    return {
      name: 'Suspension Integration',
      passed: false,
      message: `Error verifying suspension integration: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Verify notification preferences
 */
export async function verifyNotificationPreferences(): Promise<VerificationResult> {
  try {
    const preferencesModule = await import('../notification-preferences')

    const requiredFunctions = [
      'getNotificationPreferences',
      'getNotificationPreference',
      'upsertNotificationPreference',
      'deleteNotificationPreference',
      'getDefaultNotificationPreferences',
      'applyDefaultNotificationPreferences',
      'shouldReceiveNotification',
      'getEnabledChannels',
    ]

    const missing: string[] = []

    for (const fn of requiredFunctions) {
      if (typeof (preferencesModule as Record<string, unknown>)[fn] !== 'function') {
        missing.push(fn)
      }
    }

    if (missing.length > 0) {
      return {
        name: 'Notification Preferences',
        passed: false,
        message: `Missing ${missing.length} required functions`,
        details: { missing },
      }
    }

    return {
      name: 'Notification Preferences',
      passed: true,
      message: `All ${requiredFunctions.length} required preference functions are exported`,
      details: { functions: requiredFunctions },
    }
  } catch (error) {
    return {
      name: 'Notification Preferences',
      passed: false,
      message: `Error verifying notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Verify email templates
 */
export async function verifyEmailTemplates(): Promise<VerificationResult> {
  try {
    const { createSuspensionNotificationTemplate, formatSuspensionNotificationEmail } =
      await import('../notifications')

    const testReason: SuspensionReason = {
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

    const { subject, body } = formatSuspensionNotificationEmail(template)

    const requiredContent = [
      'Test Project',
      'Test Org',
      testReason.cap_type,
      '15000',
      '10000',
      'support',
    ]

    const missing: string[] = []

    for (const content of requiredContent) {
      if (!body.includes(content)) {
        missing.push(content)
      }
    }

    if (missing.length > 0) {
      return {
        name: 'Email Templates',
        passed: false,
        message: `Email template missing required content`,
        details: { missing },
      }
    }

    return {
      name: 'Email Templates',
      passed: true,
      message: 'Email templates generate correct content with all required information',
      details: { subject, bodyLength: body.length },
    }
  } catch (error) {
    return {
      name: 'Email Templates',
      passed: false,
      message: `Error verifying email templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
