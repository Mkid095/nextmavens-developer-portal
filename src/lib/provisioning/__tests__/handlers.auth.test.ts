/**
 * Tests for Auth Service Registration Handler
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { registerAuthServiceHandler } from '../handlers'
import { mockClient, mockPool, setupCommonTestEnvironment } from './test-setup'

describe('Auth Service Registration Handler', () => {
  setupCommonTestEnvironment()

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('registerAuthServiceHandler', () => {
    const projectId = 'test-project-id'

    it('should register with auth service successfully', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tenant: { id: 'auth-tenant-123', slug: 'test-project' },
          user: { id: 'user-123', email: 'admin@test-project.placeholder' },
        }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            name: 'Test Project',
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerAuthServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(2)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/create-tenant',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await registerAuthServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
      expect(result.errorDetails?.error_type).toBe('NotFoundError')
    })

    it('should store auth service configuration in metadata', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tenant: { id: 'auth-tenant-abc', slug: 'my-project' },
          user: { id: 'user-abc', email: 'admin@my-project.placeholder' },
        }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            name: 'My Project',
            slug: 'my-project',
            tenant_id: 'tenant-abc',
            environment: 'prod',
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerAuthServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('auth_service'),
        expect.arrayContaining([projectId, 'tenant-abc', 'prod'])
      )
    })

    it('should use default environment when not set', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tenant: { id: 'auth-tenant-123', slug: 'test-project' },
          user: { id: 'user-123', email: 'admin@test-project.placeholder' },
        }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            name: 'Test Project',
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: null,
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerAuthServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('auth_service'),
        expect.arrayContaining([projectId, 'tenant-123', 'dev'])
      )
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Database connection failed'))

      const result = await registerAuthServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to register with auth service')
    })
  })
})
