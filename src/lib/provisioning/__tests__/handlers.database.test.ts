/**
 * Tests for Tenant Database Creation Handler
 */

import { describe, it, expect } from 'vitest'
import { createTenantDatabaseHandler } from '../handlers'
import { mockClient, mockPool, setupBasicTestEnvironment } from './test-setup'

describe('Tenant Database Creation Handler', () => {
  setupBasicTestEnvironment()

  describe('createTenantDatabaseHandler', () => {
    const projectId = 'test-project-id'

    it('should create all tenant tables successfully', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValue(undefined) // All remaining queries (for tables, indexes, RLS policies)

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should return error when slug is missing', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [{}],
      })

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('slug is required')
    })

    it('should return error for invalid slug characters', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [{ slug: 'InvalidSlug' }],
      })

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid slug format')
    })

    it('should create users table with correct schema', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_test-project".users')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('id UUID PRIMARY KEY')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('email VARCHAR(255) UNIQUE NOT NULL')
      )
    })

    it('should create audit_log table with correct schema', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_test-project".audit_log')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('action VARCHAR(100) NOT NULL')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('actor_id UUID')
      )
    })

    it('should create _migrations table with correct schema', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_test-project"._migrations')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('version VARCHAR(100) NOT NULL UNIQUE')
      )
    })

    it('should create indexes for performance', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValue(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE INDEX IF NOT EXISTS idx_users_email ON "tenant_${slug}".users(email)`
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON "tenant_${slug}".audit_log(actor_id)`
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE INDEX IF NOT EXISTS idx_audit_log_created ON "tenant_${slug}".audit_log(created_at DESC)`
      )
    })

    it('should release client even on error', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Database error'))

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug: 'test-project' }],
        })
        .mockRejectedValueOnce(new Error('Table creation failed'))

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create tenant tables')
      expect(result.error).toContain('Table creation failed')
    })
  })
})
