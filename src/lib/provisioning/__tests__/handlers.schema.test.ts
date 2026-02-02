/**
 * Tests for Tenant Schema Creation Handler
 */

import { describe, it, expect } from 'vitest'
import { createTenantSchemaHandler } from '../handlers'
import { mockClient, mockPool, setupCommonTestEnvironment } from './test-setup'

describe('Tenant Schema Creation Handler', () => {
  setupCommonTestEnvironment()

  describe('createTenantSchemaHandler', () => {
    const projectId = 'test-project-id'

    it('should create tenant schema successfully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug: 'my-test-project' }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(4)
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
        rows: [{}],
      })

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('slug is required')
      expect(result.errorDetails?.error_type).toBe('ValidationError')
    })

    it('should return error for invalid slug characters', async () => {
      const invalidSlugs = [
        'MyProject',
        'my project',
        'my.project',
        "my'project",
        'my;project',
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
    })
  })
})
