/**
 * Verify Notification Integration - Checks Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createSuccessResult,
  createFailureResult,
  createErrorResult,
  verifyModuleFunctions,
  checkTableExists,
  getTableIndexCount,
} from '../utils'
import {
  verifyNotificationFunctions,
  verifyEmailService,
  verifyNotificationPreferences,
} from '../function-verification'
import {
  verifyDatabaseTables,
} from '../database-verification'
import {
  verifyTypeExports,
  verifySuspensionIntegration,
  verifyEmailTemplates,
} from '../integration-verification'
import { getPool } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

describe('checks-module', () => {
  const mockPool = {
    query: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('utils - createSuccessResult', () => {
    it('should create success result with message', () => {
      const result = createSuccessResult('Test Check', 'Check passed')

      expect(result).toEqual({
        name: 'Test Check',
        passed: true,
        message: 'Check passed',
      })
    })

    it('should create success result with details', () => {
      const details = { count: 5, items: ['a', 'b'] }
      const result = createSuccessResult('Test Check', 'Check passed', details)

      expect(result).toEqual({
        name: 'Test Check',
        passed: true,
        message: 'Check passed',
        details,
      })
    })

    it('should not include details when not provided', () => {
      const result = createSuccessResult('Test Check', 'Check passed')

      expect(result).not.toHaveProperty('details')
    })
  })

  describe('utils - createFailureResult', () => {
    it('should create failure result with message', () => {
      const result = createFailureResult('Test Check', 'Check failed')

      expect(result).toEqual({
        name: 'Test Check',
        passed: false,
        message: 'Check failed',
      })
    })

    it('should create failure result with details', () => {
      const details = { errors: ['error1', 'error2'] }
      const result = createFailureResult('Test Check', 'Check failed', details)

      expect(result).toEqual({
        name: 'Test Check',
        passed: false,
        message: 'Check failed',
        details,
      })
    })
  })

  describe('utils - createErrorResult', () => {
    it('should create error result from Error object', () => {
      const error = new Error('Test error')
      const result = createErrorResult('Test Check', error)

      expect(result).toEqual({
        name: 'Test Check',
        passed: false,
        message: 'Error: Test error',
      })
    })

    it('should create error result from non-Error object', () => {
      const result = createErrorResult('Test Check', 'String error')

      expect(result).toEqual({
        name: 'Test Check',
        passed: false,
        message: 'Error: Unknown error',
      })
    })

    it('should create error result from undefined', () => {
      const result = createErrorResult('Test Check', undefined)

      expect(result).toEqual({
        name: 'Test Check',
        passed: false,
        message: 'Error: Unknown error',
      })
    })
  })

  describe('utils - checkTableExists', () => {
    it('should return true when table exists', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ exists: true }],
      })

      const exists = await checkTableExists('notifications')

      expect(exists).toBe(true)
    })

    it('should return false when table does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ exists: false }],
      })

      const exists = await checkTableExists('notifications')

      expect(exists).toBe(false)
    })
  })

  describe('utils - getTableIndexCount', () => {
    it('should return count of indexes for tables', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { indexname: 'idx1' },
          { indexname: 'idx2' },
          { indexname: 'idx3' },
        ],
      })

      const count = await getTableIndexCount(['notifications', 'notification_preferences'])

      expect(count).toBe(3)
    })

    it('should return 0 when no indexes found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const count = await getTableIndexCount(['notifications'])

      expect(count).toBe(0)
    })
  })

  describe('function-verification - verifyNotificationFunctions', () => {
    it('should return success when all functions exist', async () => {
      // Mock the module import to return all required functions
      vi.doMock('../notifications', () => ({
        getNotificationRecipients: vi.fn(),
        createSuspensionNotificationTemplate: vi.fn(),
        formatSuspensionNotificationEmail: vi.fn(),
        createNotification: vi.fn(),
        sendEmailNotification: vi.fn(),
        sendSuspensionNotification: vi.fn(),
        updateNotificationDeliveryStatus: vi.fn(),
        getNotification: vi.fn(),
        getProjectNotifications: vi.fn(),
        retryFailedNotifications: vi.fn(),
      }))

      const result = await verifyNotificationFunctions()

      expect(result.passed).toBe(true)
      expect(result.message).toContain('required functions')
    })
  })

  describe('function-verification - verifyEmailService', () => {
    it('should return success when email service is configured', async () => {
      // Set environment variable
      process.env.RESEND_API_KEY = 'test-key'

      // Mock the module import
      vi.doMock('../email-service', () => ({
        sendEmail: vi.fn(),
        sendPlainTextEmail: vi.fn(),
        sendHtmlEmail: vi.fn(),
        isValidEmail: vi.fn(),
        sendBatchEmails: vi.fn(),
      }))

      const result = await verifyEmailService()

      expect(result.passed).toBe(true)
      expect(result.details?.resendKeyConfigured).toBe(true)

      // Clean up
      delete process.env.RESEND_API_KEY
    })

    it('should return success when email service functions exist but no API key', async () => {
      // Ensure API key is not set
      delete process.env.RESEND_API_KEY

      // Mock the module import
      vi.doMock('../email-service', () => ({
        sendEmail: vi.fn(),
        sendPlainTextEmail: vi.fn(),
        sendHtmlEmail: vi.fn(),
        isValidEmail: vi.fn(),
        sendBatchEmails: vi.fn(),
      }))

      const result = await verifyEmailService()

      expect(result.passed).toBe(true)
      expect(result.details?.resendKeyConfigured).toBe(false)
    })
  })

  describe('function-verification - verifyNotificationPreferences', () => {
    it('should return success when preference functions exist', async () => {
      // Mock the module import
      vi.doMock('../notification-preferences', () => ({
        getNotificationPreferences: vi.fn(),
        getNotificationPreference: vi.fn(),
        upsertNotificationPreference: vi.fn(),
        deleteNotificationPreference: vi.fn(),
        getDefaultNotificationPreferences: vi.fn(),
        applyDefaultNotificationPreferences: vi.fn(),
        shouldReceiveNotification: vi.fn(),
        getEnabledChannels: vi.fn(),
      }))

      const result = await verifyNotificationPreferences()

      expect(result.passed).toBe(true)
      expect(result.message).toContain('required preference functions')
    })
  })

  describe('database-verification - verifyDatabaseTables', () => {
    it('should return success when all tables exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // notifications
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // notification_preferences
        .mockResolvedValueOnce({ rows: [{ indexname: 'idx1' }] }) // indexes

      const result = await verifyDatabaseTables()

      expect(result.passed).toBe(true)
      expect(result.message).toContain('notifications, notification_preferences')
    })

    it('should return failure when tables are missing', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ exists: true }] }) // notifications
        .mockResolvedValueOnce({ rows: [{ exists: false }] }) // notification_preferences

      const result = await verifyDatabaseTables()

      expect(result.passed).toBe(false)
      expect(result.message).toContain('Missing required database tables')
    })

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await verifyDatabaseTables()

      expect(result.passed).toBe(false)
      expect(result.message).toContain('Error:')
    })
  })

  describe('integration-verification - verifyTypeExports', () => {
    it('should return success when types can be imported', async () => {
      // If the import works, the types exist
      const result = await verifyTypeExports()

      expect(result.passed).toBe(true)
      expect(result.message).toContain('All required types are exported')
    })

    it('should handle import errors', async () => {
      // Mock a failed import
      vi.doMock('../types', () => {
        throw new Error('Types not found')
      })

      const result = await verifyTypeExports()

      expect(result.passed).toBe(false)
    })
  })

  describe('integration-verification - verifyEmailTemplates', () => {
    it('should verify email templates contain required content', async () => {
      // Mock the notification module
      vi.doMock('../notifications', () => ({
        createSuspensionNotificationTemplate: vi.fn(() => ({
          projectName: 'Test Project',
          organizationName: 'Test Org',
          reason: { cap_type: 'DB_QUERIES_PER_DAY' },
          suspendedAt: new Date(),
        })),
        formatSuspensionNotificationEmail: vi.fn(() => ({
          subject: 'Project Suspended',
          body: 'Test Project (Test Org) has exceeded 15000 queries (limit: 10000). Please contact support.',
        })),
      }))

      // Mock the types module
      vi.doMock('../../types', () => ({
        HardCapType: {
          DB_QUERIES_PER_DAY: 'DB_QUERIES_PER_DAY',
        },
      }))

      const result = await verifyEmailTemplates()

      expect(result.passed).toBe(true)
      expect(result.message).toContain('correct content')
    })

    it('should return failure when templates missing content', async () => {
      // Mock the notification module with incomplete content
      vi.doMock('../notifications', () => ({
        createSuspensionNotificationTemplate: vi.fn(() => ({
          projectName: 'Test Project',
          organizationName: 'Test Org',
          reason: { cap_type: 'DB_QUERIES_PER_DAY' },
          suspendedAt: new Date(),
        })),
        formatSuspensionNotificationEmail: vi.fn(() => ({
          subject: 'Project Suspended',
          body: 'Incomplete body',
        })),
      }))

      // Mock the types module
      vi.doMock('../../types', () => ({
        HardCapType: {
          DB_QUERIES_PER_DAY: 'DB_QUERIES_PER_DAY',
        },
      }))

      const result = await verifyEmailTemplates()

      expect(result.passed).toBe(false)
      expect(result.message).toContain('missing required content')
    })
  })

  describe('integration-verification - verifySuspensionIntegration', () => {
    it('should verify suspension module has notification integration', async () => {
      // Mock the suspensions module with proper integration
      vi.doMock('../suspensions', () => ({
        sendSuspensionNotification: vi.fn(),
        // Include code that references sendSuspensionNotification
        someFunction: function() {
          // Simulating actual integration code
          return 'sendSuspensionNotification(projectId)'
        },
      }))

      const result = await verifySuspensionIntegration()

      expect(result.passed).toBe(true)
    })

    it('should detect missing notification integration', async () => {
      // Mock the suspensions module without notification integration
      vi.doMock('../suspensions', () => ({
        suspendProject: vi.fn(),
        // No sendSuspensionNotification references
      }))

      const result = await verifySuspensionIntegration()

      expect(result.passed).toBe(false)
      expect(result.message).toContain('not properly integrated')
    })
  })

  describe('utils - verifyModuleFunctions', () => {
    it('should return success when all functions exist in module', async () => {
      // Create a test module with all required functions
      const testModulePath = './test-module'
      vi.doMock(testModulePath, () => ({
        function1: vi.fn(),
        function2: vi.fn(),
        function3: vi.fn(),
      }))

      const result = await verifyModuleFunctions(testModulePath, ['function1', 'function2', 'function3'])

      expect(result.hasAll).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('should return missing functions when some are not exported', async () => {
      const testModulePath = './test-module-partial'
      vi.doMock(testModulePath, () => ({
        function1: vi.fn(),
        // function2 is missing
        function3: vi.fn(),
      }))

      const result = await verifyModuleFunctions(testModulePath, ['function1', 'function2', 'function3'])

      expect(result.hasAll).toBe(false)
      expect(result.missing).toContain('function2')
    })

    it('should return all functions as missing when module import fails', async () => {
      const testModulePath = './non-existent-module'
      vi.doMock(testModulePath, () => {
        throw new Error('Module not found')
      })

      const result = await verifyModuleFunctions(testModulePath, ['function1', 'function2'])

      expect(result.hasAll).toBe(false)
      expect(result.missing).toHaveLength(2)
    })
  })
})
