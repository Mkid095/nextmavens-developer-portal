/**
 * Tests for API Keys Generation Handler
 */

import { describe, it, expect } from 'vitest'
import { generateApiKeysHandler } from '../handlers'
import { mockClient, mockPool, setupBasicTestEnvironment } from './test-setup'

describe('API Keys Generation Handler', () => {
  setupBasicTestEnvironment()

  describe('generateApiKeysHandler', () => {
    const projectId = 'test-project-id'

    it('should generate all three API key types successfully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
        .mockResolvedValueOnce(undefined) // Insert keys
        .mockResolvedValueOnce(undefined) // Update metadata

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(4)
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should insert keys with correct key_type values', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
        .mockResolvedValueOnce(undefined) // Insert keys
        .mockResolvedValueOnce(undefined) // Update metadata

      await generateApiKeysHandler(projectId, mockPool)

      const insertCall = mockClient.query.mock.calls[2]
      expect(insertCall[0]).toContain('INSERT INTO control_plane.api_keys')
      expect(insertCall[0]).toContain("'public'")
      expect(insertCall[0]).toContain("'secret'")
      expect(insertCall[0]).toContain("'service_role'")
    })

    it('should use environment-specific key prefixes', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'prod',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
        .mockResolvedValueOnce(undefined) // Insert keys
        .mockResolvedValueOnce(undefined) // Update metadata

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should use dev environment as default', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: null,
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
        .mockResolvedValueOnce(undefined) // Insert keys
        .mockResolvedValueOnce(undefined) // Update metadata

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should set correct scopes for service_role key', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
        .mockResolvedValueOnce(undefined) // Insert keys
        .mockResolvedValueOnce(undefined) // Update metadata

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should store API key preview in metadata', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
        .mockResolvedValueOnce(undefined) // Insert keys
        .mockResolvedValueOnce(undefined) // Update metadata

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should use ON CONFLICT for idempotency', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
        .mockResolvedValueOnce(undefined) // Insert keys
        .mockResolvedValueOnce(undefined) // Update metadata

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockRejectedValueOnce(new Error('Key generation failed'))

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to generate API keys')
    })
  })
})
