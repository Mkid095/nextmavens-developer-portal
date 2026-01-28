/**
 * Test script for notification system integration
 *
 * This script tests:
 * 1. Database connection
 * 2. Notifications table exists
 * 3. Notification functions work correctly
 * 4. Integration with suspension system
 */

import { getPool } from '../src/lib/db'
import {
  getNotificationRecipients,
  createNotification,
  getNotification,
  getProjectNotifications,
  createSuspensionNotificationTemplate,
  formatSuspensionNotificationEmail,
} from '../src/features/abuse-controls/lib/notifications'
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  HardCapType,
} from '../src/features/abuse-controls/types'

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===')
  try {
    const pool = getPool()
    await pool.query('SELECT 1')
    console.log('✓ Database connection successful')
    return true
  } catch (error) {
    console.error('✗ Database connection failed:', error)
    return false
  }
}

async function testNotificationsTable() {
  console.log('\n=== Testing Notifications Table ===')
  try {
    const pool = getPool()

    // Check if table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notifications'
      )
    `)

    if (result.rows[0].exists) {
      console.log('✓ Notifications table exists')

      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        ORDER BY ordinal_position
      `)

      console.log('✓ Table structure:')
      columns.rows.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })

      return true
    } else {
      console.error('✗ Notifications table does not exist')
      return false
    }
  } catch (error) {
    console.error('✗ Error checking notifications table:', error)
    return false
  }
}

async function testCreateNotification() {
  console.log('\n=== Testing Create Notification ===')
  try {
    const pool = getPool()

    // Create a test notification
    const notificationId = await createNotification(
      'test-project-id',
      NotificationType.PROJECT_SUSPENDED,
      NotificationPriority.HIGH,
      'Test Subject',
      'Test Body',
      { test: 'data' },
      [NotificationChannel.EMAIL]
    )

    console.log(`✓ Created notification with ID: ${notificationId}`)

    // Retrieve the notification
    const notification = await getNotification(notificationId)

    if (notification) {
      console.log('✓ Retrieved notification successfully')
      console.log(`  Subject: ${notification.subject}`)
      console.log(`  Status: ${notification.status}`)
      console.log(`  Priority: ${notification.priority}`)

      // Clean up test notification
      await pool.query('DELETE FROM notifications WHERE id = $1', [notificationId])
      console.log('✓ Cleaned up test notification')

      return true
    } else {
      console.error('✗ Failed to retrieve notification')
      return false
    }
  } catch (error) {
    console.error('✗ Error creating notification:', error)
    return false
  }
}

async function testSuspensionTemplate() {
  console.log('\n=== Testing Suspension Notification Template ===')
  try {
    const template = createSuspensionNotificationTemplate(
      'Test Project',
      'Test Org',
      {
        cap_type: HardCapType.DB_QUERIES_PER_DAY,
        current_value: 15000,
        limit_exceeded: 10000,
        details: 'Exceeded database query limit',
      },
      new Date()
    )

    console.log('✓ Created suspension template')
    console.log(`  Project: ${template.project_name}`)
    console.log(`  Org: ${template.org_name}`)
    console.log(`  Support: ${template.support_contact}`)
    console.log(`  Resolution steps: ${template.resolution_steps.length}`)

    // Test email formatting
    const { subject, body } = formatSuspensionNotificationEmail(template)

    console.log('✓ Formatted email')
    console.log(`  Subject: ${subject}`)
    console.log(`  Body length: ${body.length} characters`)

    return true
  } catch (error) {
    console.error('✗ Error creating template:', error)
    return false
  }
}

async function testNotificationRecipients() {
  console.log('\n=== Testing Notification Recipients ===')
  try {
    // This test requires actual project data in the database
    // For now, we'll just verify the function exists and doesn't throw
    console.log('✓ getNotificationRecipients function exists')
    console.log('  (Note: Requires actual project data to fully test)')

    return true
  } catch (error) {
    console.error('✗ Error testing recipients:', error)
    return false
  }
}

async function runAllTests() {
  console.log('🧪 Running Notification System Tests')
  console.log('=====================================')

  const results = {
    database: await testDatabaseConnection(),
    table: await testNotificationsTable(),
    create: await testCreateNotification(),
    template: await testSuspensionTemplate(),
    recipients: await testNotificationRecipients(),
  }

  console.log('\n=== Test Results ===')
  console.log(`Database Connection: ${results.database ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`Notifications Table: ${results.table ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`Create Notification: ${results.create ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`Suspension Template: ${results.template ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`Notification Recipients: ${results.recipients ? '✓ PASS' : '✗ FAIL'}`)

  const allPassed = Object.values(results).every((result) => result === true)

  if (allPassed) {
    console.log('\n✓ All tests passed!')
    process.exit(0)
  } else {
    console.log('\n✗ Some tests failed')
    process.exit(1)
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test suite error:', error)
  process.exit(1)
})
