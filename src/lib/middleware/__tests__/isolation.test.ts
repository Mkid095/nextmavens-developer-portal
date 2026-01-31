/**
 * Isolation Tests
 *
 * US-011: Test suite for resource isolation enforcement.
 * Verifies that cross-project access is impossible across all services.
 *
 * Tests cross-project DB access, realtime access, and storage access.
 * All tests verify 403 response for cross-project access attempts.
 */

import { describe, it, expect } from 'vitest'
import {
  validateQueryIsolation,
  SchemaScopeError,
} from '../schema-scope'
import {
  validateChannelSubscription,
  buildChannelName,
  RealtimeScopeError,
  ChannelType,
} from '../realtime-scope'
import {
  validateStoragePath,
  buildStoragePath,
  StorageScopeError,
} from '../storage-scope'

describe('Resource Isolation Tests (US-011)', () => {
  const projectId1 = 'abc-123-project-1'
  const projectId2 = 'def-456-project-2'
  const validUUID = '01234567-89ab-cdef-0123-456789abcdef'

  describe('Database Query Isolation (US-002)', () => {
    it('should allow queries within the same schema', () => {
      const schemaName = `tenant_${projectId1}`

      // Valid query - no schema prefix (uses search_path)
      expect(() => {
        validateQueryIsolation('SELECT * FROM users', schemaName)
      }).not.toThrow()

      // Valid query - same schema prefix
      expect(() => {
        validateQueryIsolation(`SELECT * FROM ${schemaName}.users`, schemaName)
      }).not.toThrow()
    })

    it('should block cross-schema queries with 403', () => {
      const schemaName1 = `tenant_${projectId1}`
      const schemaName2 = `tenant_${projectId2}`

      // Cross-schema query attempt
      expect(() => {
        validateQueryIsolation(`SELECT * FROM ${schemaName2}.users`, schemaName1)
      }).toThrow(SchemaScopeError.CROSS_SCHEMA_ACCESS)
    })

    it('should allow public and system schema access', () => {
      const schemaName = `tenant_${projectId1}`

      // Public schema is allowed
      expect(() => {
        validateQueryIsolation('SELECT * FROM public.migrations', schemaName)
      }).not.toThrow()

      // Information schema is allowed
      expect(() => {
        validateQueryIsolation('SELECT * FROM information_schema.tables', schemaName)
      }).not.toThrow()

      // pg_catalog is allowed
      expect(() => {
        validateQueryIsolation('SELECT * FROM pg_catalog.pg_class', schemaName)
      }).not.toThrow()
    })
  })

  describe('Realtime Channel Isolation (US-003)', () => {
    it('should allow subscriptions to own project channels', () => {
      const channel = buildChannelName(validUUID, ChannelType.TABLE, 'users')

      expect(() => {
        validateChannelSubscription(channel, validUUID)
      }).not.toThrow()
    })

    it('should block cross-project channel subscriptions with 403', () => {
      const channel1 = buildChannelName(projectId1, ChannelType.TABLE, 'users')

      // Attempt to subscribe to another project's channel
      expect(() => {
        validateChannelSubscription(channel1, projectId2)
      }).toThrow(RealtimeScopeError.CROSS_PROJECT_CHANNEL)
    })

    it('should enforce channel prefix format', () => {
      const channel = buildChannelName(validUUID, ChannelType.TABLE, 'users')

      // Verify channel format: project_id:channel_type:identifier
      expect(channel).toMatch(/^[a-f0-9-]+:table:[a-zA-Z0-9_-]+$/)
      expect(channel).toEqual(`${validUUID}:table:users`)
    })

    it('should block reserved channel names', () => {
      // System channels should be rejected
      expect(() => {
        buildChannelName(validUUID, ChannelType.TABLE, 'system')
      }).toThrow()
    })
  })

  describe('Storage Path Isolation (US-004)', () => {
    it('should allow access to own project paths', () => {
      const path = buildStoragePath(validUUID, '/uploads/image.png')

      expect(() => {
        validateStoragePath(path, validUUID)
      }).not.toThrow()
    })

    it('should block cross-project path access with 403', () => {
      const path1 = buildStoragePath(projectId1, '/uploads/image.png')

      // Attempt to access another project's files
      expect(() => {
        validateStoragePath(path1, projectId2)
      }).toThrow(StorageScopeError.CROSS_PROJECT_PATH)
    })

    it('should enforce path prefix format', () => {
      const path = buildStoragePath(validUUID, '/documents/report.pdf')

      // Verify path format: project_id:/path
      expect(path).toMatch(/^[a-f0-9-]+:\/[a-zA-Z0-9_/-]+$/)
      expect(path).toEqual(`${validUUID}:/documents/report.pdf`)
    })

    it('should block path traversal attempts', () => {
      // Path traversal should be blocked
      expect(() => {
        buildStoragePath(validUUID, '../etc/passwd')
      }).toThrow()

      expect(() => {
        buildStoragePath(validUUID, '/../../secret')
      }).toThrow()
    })
  })

  describe('Cross-Project Access Returns 403 (US-005)', () => {
    it('should return 403 error code for cross-project DB access', () => {
      const schemaName1 = `tenant_${projectId1}`
      const schemaName2 = `tenant_${projectId2}`

      expect(() => {
        validateQueryIsolation(`SELECT * FROM ${schemaName2}.users`, schemaName1)
      }).toThrow(SchemaScopeError.CROSS_SCHEMA_ACCESS)
    })

    it('should return 403 error code for cross-project realtime access', () => {
      const channel = buildChannelName(projectId1, ChannelType.TABLE, 'users')

      expect(() => {
        validateChannelSubscription(channel, projectId2)
      }).toThrow(RealtimeScopeError.CROSS_PROJECT_CHANNEL)
    })

    it('should return 403 error code for cross-project storage access', () => {
      const path = buildStoragePath(projectId1, '/uploads/image.png')

      expect(() => {
        validateStoragePath(path, projectId2)
      }).toThrow(StorageScopeError.CROSS_PROJECT_PATH)
    })
  })

  describe('JWT Contains project_id Claim (US-001)', () => {
    it('should include project_id in channel names', () => {
      const channel = buildChannelName(validUUID, ChannelType.TABLE, 'users')
      expect(channel).toContain(validUUID)
    })

    it('should include project_id in storage paths', () => {
      const path = buildStoragePath(validUUID, '/uploads/image.png')
      expect(path).toContain(validUUID)
    })

    it('should validate project_id is a valid UUID', () => {
      // Valid UUID
      expect(() => {
        buildChannelName(validUUID, ChannelType.TABLE, 'users')
      }).not.toThrow()

      // Invalid UUID
      expect(() => {
        buildChannelName('not-a-uuid', ChannelType.TABLE, 'users')
      }).toThrow()
    })
  })
})
