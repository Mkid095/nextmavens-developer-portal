/**
 * API Key Handlers Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApiKey, rotateApiKey, revokeApiKey, deleteApiKey } from '../api-key-handlers'
import { API_ENDPOINTS } from '../constants'

// Mock fetch
global.fetch = vi.fn()

describe('api-key-handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup localStorage mock
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createApiKey', () => {
    it('should successfully create an API key', async () => {
      const mockResponse = {
        apiKey: { id: 'key-123', key_prefix: 'pk_test_' },
        secretKey: 'sk_test_secret',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onFinally = vi.fn()

      await createApiKey(
        {
          name: 'Test Key',
          keyType: 'public',
          environment: 'live',
          scopes: ['db:select'],
          mcpAccessLevel: 'ro',
        },
        { onSuccess, onError, onFinally }
      )

      expect(onSuccess).toHaveBeenCalledWith(mockResponse)
      expect(onFinally).toHaveBeenCalled()
    })

    it('should handle create API key errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid request' }),
      } as Response)

      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onFinally = vi.fn()

      await createApiKey(
        {
          name: 'Test Key',
          keyType: 'public',
          environment: 'live',
          scopes: ['db:select'],
          mcpAccessLevel: 'ro',
        },
        { onSuccess, onError, onFinally }
      )

      expect(onError).toHaveBeenCalledWith('Invalid request')
      expect(onFinally).toHaveBeenCalled()
    })

    it('should include mcp_access_level for MCP keys', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ apiKey: {}, secretKey: '' }),
      } as Response)

      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onFinally = vi.fn()

      await createApiKey(
        {
          name: 'MCP Key',
          keyType: 'mcp',
          environment: 'live',
          scopes: ['db:select'],
          mcpAccessLevel: 'rw',
        },
        { onSuccess, onError, onFinally }
      )

      expect(fetch).toHaveBeenCalledWith(
        '/api/api-keys',
        expect.objectContaining({
          body: expect.stringContaining('mcp_access_level'),
        })
      )
    })
  })

  describe('rotateApiKey', () => {
    it('should successfully rotate an API key', async () => {
      const mockResponse = {
        newKey: 'pk_test_new',
        secretKey: 'sk_test_new_secret',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onFinally = vi.fn()

      await rotateApiKey('key-123', { onSuccess, onError, onFinally })

      expect(fetch).toHaveBeenCalledWith('/api/keys/key-123/rotate', expect.any(Object))
      expect(onSuccess).toHaveBeenCalledWith({
        apiKey: mockResponse.newKey,
        secretKey: mockResponse.secretKey,
      })
      expect(onFinally).toHaveBeenCalled()
    })

    it('should handle rotate API key errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Key not found' }),
      } as Response)

      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onFinally = vi.fn()

      await rotateApiKey('invalid-key', { onSuccess, onError, onFinally })

      expect(onError).toHaveBeenCalledWith('Key not found')
      expect(onFinally).toHaveBeenCalled()
    })
  })

  describe('revokeApiKey', () => {
    it('should successfully revoke an API key', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)

      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onFinally = vi.fn()

      await revokeApiKey('key-123', { onSuccess, onError, onFinally })

      expect(fetch).toHaveBeenCalledWith('/api/keys/key-123/revoke', expect.any(Object))
      expect(onSuccess).toHaveBeenCalled()
      expect(onFinally).toHaveBeenCalled()
    })

    it('should handle revoke API key errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Key already revoked' }),
      } as Response)

      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onFinally = vi.fn()

      await revokeApiKey('key-123', { onSuccess, onError, onFinally })

      expect(onError).toHaveBeenCalledWith('Key already revoked')
      expect(onFinally).toHaveBeenCalled()
    })
  })

  describe('deleteApiKey', () => {
    it('should successfully delete an API key after confirmation', async () => {
      // Mock confirm to return true
      global.confirm = vi.fn(() => true)

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      const onSuccess = vi.fn()

      await deleteApiKey('key-123', { onSuccess })

      expect(fetch).toHaveBeenCalledWith('/api/api-keys?id=key-123', expect.any(Object))
      expect(onSuccess).toHaveBeenCalled()
    })

    it('should not delete API key if user cancels confirmation', async () => {
      // Mock confirm to return false
      global.confirm = vi.fn(() => false)

      const onSuccess = vi.fn()

      await deleteApiKey('key-123', { onSuccess })

      expect(fetch).not.toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })
})
