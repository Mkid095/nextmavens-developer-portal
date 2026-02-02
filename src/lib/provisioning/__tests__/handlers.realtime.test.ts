/**
 * Tests for Realtime Service Registration Handler
 */

import { describe, it, expect, vi } from 'vitest'
import { registerRealtimeServiceHandler } from '../handlers'
import { mockClient, mockPool, setupBasicTestEnvironment } from './test-setup'

describe('Realtime Service Registration Handler', () => {
  setupBasicTestEnvironment()

  describe('registerRealtimeServiceHandler', () => {
    const projectId = 'test-project-id'

    it('should register with realtime service successfully', async () => {
      // Mock fetch response for health check
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', service: 'realtime-service' }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-456',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(2)
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should store realtime service configuration in metadata', async () => {
      // Mock fetch response for health check
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', service: 'realtime-service' }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'my-project',
            tenant_id: 'tenant-xyz',
            environment: 'staging',
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerRealtimeServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('realtime_service'),
        expect.arrayContaining([projectId, 'tenant-xyz', 'staging', 'tenant-xyz:'])
      )
    })

    it('should set default connection limits', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as Response)

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

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Registration failed'))

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to register with realtime service')
    })
  })
})
