/**
 * Tests for Storage Service Registration Handler
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { registerStorageServiceHandler } from '../handlers'
import { mockClient, mockPool, setupCommonTestEnvironment } from './test-setup'

describe('Storage Service Registration Handler', () => {
  setupCommonTestEnvironment()

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('registerStorageServiceHandler', () => {
    const projectId = 'test-project-id'

    it('should register with storage service successfully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-789',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(2)
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should return error when no storage credentials configured', async () => {
      vi.unstubAllEnvs() // Clear storage credentials

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-789',
            environment: 'dev',
          }],
        })

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No storage service credentials configured')
    })

    it('should store storage service configuration in metadata', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'my-project',
            tenant_id: 'tenant-def',
            environment: 'prod',
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerStorageServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('storage_service'),
        expect.arrayContaining([projectId, 'tenant-def', 'prod', 'tenant-def/'])
      )
    })

    it('should set default storage quotas', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Storage registration failed'))

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to register with storage service')
    })
  })
})
