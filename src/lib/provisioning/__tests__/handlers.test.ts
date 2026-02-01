/**
 * Tests for Provisioning Step Handlers
 *
 * Tests tenant schema creation, tenant database tables, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Pool } from 'pg'
import { createTenantSchemaHandler, createTenantDatabaseHandler } from '../handlers'

// Mock pool client
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
}

// Mock pool
const mockPool = {
  connect: vi.fn(),
} as unknown as Pool

describe('Tenant Schema Creation Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  describe('createTenantSchemaHandler', () => {
    const projectId = 'test-project-id'

    it('should create tenant schema successfully', async () => {
      // Mock project query result
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug: 'my-test-project' }],
        })
        // Mock CREATE SCHEMA
        .mockResolvedValueOnce(undefined)
        // Mock GRANT USAGE
        .mockResolvedValueOnce(undefined)
        // Mock GRANT CREATE
        .mockResolvedValueOnce(undefined)

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(4) // SELECT + CREATE + 2 GRANTs
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
      expect(result.errorDetails?.error_type).toBe('NotFoundError')
    })

    it('should return error when slug is missing', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [{}], // No slug
      })

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('slug is required')
      expect(result.errorDetails?.error_type).toBe('ValidationError')
    })

    it('should return error for invalid slug characters', async () => {
      const invalidSlugs = [
        'MyProject', // uppercase
        'my project', // spaces
        'my.project', // dots
        "my'project", // quotes
        'my;project', // semicolon
        'my-project\'DROP TABLE--', // SQL injection attempt
      ]

      for (const invalidSlug of invalidSlugs) {
        vi.clearAllMocks()
        vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)

        mockClient.query = vi.fn().mockResolvedValueOnce({
          rows: [{ slug: invalidSlug }],
        })

        const result = await createTenantSchemaHandler(projectId, mockPool)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid slug format')
        expect(result.errorDetails?.error_type).toBe('ValidationError')
        expect(result.errorDetails?.context).toMatchObject({ slug: invalidSlug })
      }
    })

    it('should accept valid slugs with lowercase letters, numbers, and hyphens', async () => {
      const validSlugs = [
        'my-project',
        'my-test-project-123',
        'project',
        'my-project-v2',
        '123project',
        'my-test-project-2',
      ]

      for (const validSlug of validSlugs) {
        vi.clearAllMocks()
        vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)

        mockClient.query = vi.fn()
          .mockResolvedValueOnce({
            rows: [{ slug: validSlug }],
          })
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined)

        const result = await createTenantSchemaHandler(projectId, mockPool)

        expect(result.success).toBe(true)
      }
    })

    it('should use correct schema name pattern', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await createTenantSchemaHandler(projectId, mockPool)

      // Verify CREATE SCHEMA was called with correct pattern
      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE SCHEMA IF NOT EXISTS "tenant_${slug}"`
      )
    })

    it('should release client even on error', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Database connection failed'))

      await createTenantSchemaHandler(projectId, mockPool)

      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug: 'test-project' }],
        })
        .mockRejectedValueOnce(new Error('Permission denied to create schema'))

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create tenant schema')
      expect(result.error).toContain('Permission denied')
      expect(result.errorDetails?.error_type).toBe('Error')
    })
  })
})

describe('Tenant Database Creation Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  describe('createTenantDatabaseHandler', () => {
    const projectId = 'test-project-id'

    it('should create all tenant tables successfully', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        // Mock SELECT slug
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        // Mock CREATE users table
        .mockResolvedValueOnce(undefined)
        // Mock CREATE idx_users_email
        .mockResolvedValueOnce(undefined)
        // Mock CREATE audit_log table
        .mockResolvedValueOnce(undefined)
        // Mock CREATE idx_audit_log_actor
        .mockResolvedValueOnce(undefined)
        // Mock CREATE idx_audit_log_created
        .mockResolvedValueOnce(undefined)
        // Mock CREATE _migrations table
        .mockResolvedValueOnce(undefined)

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(7) // SELECT + 3 tables + 3 indexes
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
      expect(result.errorDetails?.error_type).toBe('NotFoundError')
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
        .mockResolvedValueOnce(undefined) // users table

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
        .mockResolvedValueOnce(undefined) // users table
        .mockResolvedValueOnce(undefined) // idx_users_email
        .mockResolvedValueOnce(undefined) // audit_log table

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
        .mockResolvedValueOnce(undefined) // users table
        .mockResolvedValueOnce(undefined) // idx_users_email
        .mockResolvedValueOnce(undefined) // audit_log table
        .mockResolvedValueOnce(undefined) // idx_audit_log_actor
        .mockResolvedValueOnce(undefined) // idx_audit_log_created
        .mockResolvedValueOnce(undefined) // _migrations table

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
        .mockResolvedValueOnce(undefined) // users table
        .mockResolvedValueOnce(undefined) // idx_users_email
        .mockResolvedValueOnce(undefined) // audit_log table
        .mockResolvedValueOnce(undefined) // idx_audit_log_actor
        .mockResolvedValueOnce(undefined) // idx_audit_log_created
        .mockResolvedValueOnce(undefined) // _migrations table

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

describe('Handler Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  it('should use IF NOT EXISTS for idempotency', async () => {
    const slug = 'test-project'
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ slug }],
      })
      .mockResolvedValueOnce(undefined)

    await createTenantSchemaHandler('project-id', mockPool)

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('IF NOT EXISTS')
    )
  })

  it('should handle special characters in slug safely', async () => {
    // Even though validation rejects these, ensure no SQL injection is possible
    const dangerousSlug = "'; DROP TABLE users; --"
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ slug: dangerousSlug }],
      })

    const result = await createTenantSchemaHandler('project-id', mockPool)

    // Should fail validation before any SQL is executed
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid slug format')
  })
})
