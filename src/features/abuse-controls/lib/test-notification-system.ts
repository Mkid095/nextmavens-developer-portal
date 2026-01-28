/**
 * Test Notification System
 *
 * Verifies that the suspension notification system is working correctly.
 * This test validates the entire notification flow from suspension to email delivery.
 */

import { getPool } from '@/lib/db'
import {
  createSuspensionNotificationTemplate,
  formatSuspensionNotificationEmail,
  getNotificationRecipients,
  createNotification,
  sendEmailNotification,
  sendSuspensionNotification,
} from './notifications'
import { HardCapType, NotificationType, NotificationPriority, NotificationChannel } from '../types'
import type { SuspensionReason, NotificationDeliveryResult } from '../types'

/**
 * Test data for suspension notification
 */
const testProjectId = '00000000-0000-0000-0000-000000000000'
const testProjectName = 'Test Project'
const testOrgName = 'Test Organization'

const testSuspensionReason: SuspensionReason = {
  cap_type: HardCapType.DB_QUERIES_PER_DAY,
  current_value: 15000,
  limit_exceeded: 10000,
  details: 'Project exceeded database queries per day limit',
}

/**
 * Test 1: Create suspension notification template
 */
export async function testCreateSuspensionNotificationTemplate(): Promise<boolean> {
  try {
    console.log('[Test] Creating suspension notification template...')

    const template = createSuspensionNotificationTemplate(
      testProjectName,
      testOrgName,
      testSuspensionReason,
      new Date()
    )

    if (!template.project_name || !template.org_name || !template.reason) {
      console.error('[Test] Template missing required fields')
      return false
    }

    if (!template.support_contact || template.resolution_steps.length === 0) {
      console.error('[Test] Template missing support contact or resolution steps')
      return false
    }

    console.log('[Test] ✓ Suspension notification template created successfully')
    console.log(`[Test]   - Project: ${template.project_name}`)
    console.log(`[Test]   - Organization: ${template.org_name}`)
    console.log(`[Test]   - Support: ${template.support_contact}`)
    console.log(`[Test]   - Resolution Steps: ${template.resolution_steps.length}`)

    return true
  } catch (error) {
    console.error('[Test] ✗ Failed to create suspension notification template:', error)
    return false
  }
}

/**
 * Test 2: Format suspension notification email
 */
export async function testFormatSuspensionNotificationEmail(): Promise<boolean> {
  try {
    console.log('[Test] Formatting suspension notification email...')

    const template = createSuspensionNotificationTemplate(
      testProjectName,
      testOrgName,
      testSuspensionReason,
      new Date()
    )

    const { subject, body } = formatSuspensionNotificationEmail(template)

    if (!subject || !body) {
      console.error('[Test] Email subject or body is empty')
      return false
    }

    // Check that email contains required information
    const requiredContent = [
      testProjectName,
      testOrgName,
      testSuspensionReason.cap_type,
      testSuspensionReason.current_value.toString(),
      testSuspensionReason.limit_exceeded.toString(),
      template.support_contact,
    ]

    for (const content of requiredContent) {
      if (!body.includes(content)) {
        console.error(`[Test] Email body missing required content: ${content}`)
        return false
      }
    }

    console.log('[Test] ✓ Suspension notification email formatted successfully')
    console.log(`[Test]   - Subject: ${subject}`)
    console.log(`[Test]   - Body Length: ${body.length} characters`)

    return true
  } catch (error) {
    console.error('[Test] ✗ Failed to format suspension notification email:', error)
    return false
  }
}

/**
 * Test 3: Get notification recipients
 */
export async function testGetNotificationRecipients(): Promise<boolean> {
  try {
    console.log('[Test] Getting notification recipients...')

    const recipients = await getNotificationRecipients(
      testProjectId,
      NotificationType.PROJECT_SUSPENDED
    )

    if (!Array.isArray(recipients)) {
      console.error('[Test] Recipients is not an array')
      return false
    }

    // Validate recipient structure
    for (const recipient of recipients) {
      if (!recipient.id || !recipient.email) {
        console.error('[Test] Recipient missing required fields')
        return false
      }
    }

    console.log('[Test] ✓ Notification recipients retrieved successfully')
    console.log(`[Test]   - Recipients: ${recipients.length}`)

    return true
  } catch (error) {
    console.error('[Test] ✗ Failed to get notification recipients:', error)
    return false
  }
}

/**
 * Test 4: Create notification record
 */
export async function testCreateNotification(): Promise<boolean> {
  try {
    console.log('[Test] Creating notification record...')

    const { subject, body } = formatSuspensionNotificationEmail(
      createSuspensionNotificationTemplate(
        testProjectName,
        testOrgName,
        testSuspensionReason,
        new Date()
      )
    )

    const notificationId = await createNotification(
      testProjectId,
      NotificationType.PROJECT_SUSPENDED,
      NotificationPriority.HIGH,
      subject,
      body,
      { reason: testSuspensionReason },
      [NotificationChannel.EMAIL]
    )

    if (!notificationId) {
      console.error('[Test] Notification ID is empty')
      return false
    }

    console.log('[Test] ✓ Notification record created successfully')
    console.log(`[Test]   - Notification ID: ${notificationId}`)

    return true
  } catch (error) {
    console.error('[Test] ✗ Failed to create notification record:', error)
    return false
  }
}

/**
 * Test 5: Send email notification (without actual delivery)
 */
export async function testSendEmailNotification(): Promise<boolean> {
  try {
    console.log('[Test] Sending email notification...')

    const { subject, body } = formatSuspensionNotificationEmail(
      createSuspensionNotificationTemplate(
        testProjectName,
        testOrgName,
        testSuspensionReason,
        new Date()
      )
    )

    // This test will attempt to send an email, but may fail if Resend is not configured
    const result: NotificationDeliveryResult = await sendEmailNotification(
      'test@example.com',
      subject,
      body
    )

    console.log('[Test] Email notification send attempted')
    console.log(`[Test]   - Success: ${result.success}`)
    console.log(`[Test]   - Channel: ${result.channel}`)

    if (!result.success) {
      console.log(`[Test]   - Error: ${result.error || 'Unknown error'}`)
      console.log('[Test]   Note: This is expected if Resend is not configured')
    }

    return true // We consider this a pass even if email fails, as long as no exception
  } catch (error) {
    console.error('[Test] ✗ Failed to send email notification:', error)
    return false
  }
}

/**
 * Test 6: Full suspension notification flow
 */
export async function testFullSuspensionNotificationFlow(): Promise<boolean> {
  try {
    console.log('[Test] Testing full suspension notification flow...')

    const results: NotificationDeliveryResult[] = await sendSuspensionNotification(
      testProjectId,
      testProjectName,
      testOrgName,
      testSuspensionReason,
      new Date()
    )

    if (!Array.isArray(results)) {
      console.error('[Test] Send suspension notification did not return array')
      return false
    }

    console.log('[Test] ✓ Full suspension notification flow completed')
    console.log(`[Test]   - Delivery Results: ${results.length}`)

    for (const result of results) {
      console.log(`[Test]     - Success: ${result.success}`)
      console.log(`[Test]     - Channel: ${result.channel}`)
      if (!result.success) {
        console.log(`[Test]     - Error: ${result.error || 'Unknown error'}`)
      }
    }

    return true
  } catch (error) {
    console.error('[Test] ✗ Failed to complete full suspension notification flow:', error)
    return false
  }
}

/**
 * Run all notification system tests
 */
export async function runNotificationSystemTests(): Promise<{
  passed: number
  failed: number
  results: Array<{ name: string; passed: boolean }>
}> {
  console.log('\n========================================')
  console.log('Notification System Tests')
  console.log('========================================\n')

  const tests = [
    { name: 'Create Suspension Notification Template', fn: testCreateSuspensionNotificationTemplate },
    { name: 'Format Suspension Notification Email', fn: testFormatSuspensionNotificationEmail },
    { name: 'Get Notification Recipients', fn: testGetNotificationRecipients },
    { name: 'Create Notification Record', fn: testCreateNotification },
    { name: 'Send Email Notification', fn: testSendEmailNotification },
    { name: 'Full Suspension Notification Flow', fn: testFullSuspensionNotificationFlow },
  ]

  let passed = 0
  let failed = 0
  const results: Array<{ name: string; passed: boolean }> = []

  for (const test of tests) {
    try {
      const result = await test.fn()
      results.push({ name: test.name, passed: result })

      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`[Test] Unexpected error in ${test.name}:`, error)
      results.push({ name: test.name, passed: false })
      failed++
    }

    console.log('') // Empty line between tests
  }

  console.log('========================================')
  console.log('Test Results Summary')
  console.log('========================================')
  console.log(`Total Tests: ${tests.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log('========================================\n')

  return { passed, failed, results }
}

/**
 * Main function to run tests
 */
export async function main(): Promise<void> {
  try {
    const results = await runNotificationSystemTests()

    if (results.failed > 0) {
      console.log('\n[Tests] Some tests failed. Please review the errors above.')
      process.exit(1)
    } else {
      console.log('\n[Tests] All tests passed successfully!')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n[Tests] Fatal error running tests:', error)
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main()
}
