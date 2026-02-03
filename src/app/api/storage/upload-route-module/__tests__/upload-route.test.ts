/**
 * Storage Upload Route Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { handleUpload, handleList } from '..'
import { getPool } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

vi.mock('@/lib/middleware', () => ({
  authenticateRequest: vi.fn(),
  type: {},
}))

vi.mock('@/lib/features', () => ({
  checkFeature: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('@/lib/middleware/storage-scope', () => ({
  buildStoragePath: vi.fn((id, path) => `${id}:${path}`),
  validateStoragePath: vi.fn(),
  StorageScopeError: {
    CROSS_PROJECT_PATH: 'Cross-project path access',
  },
}))

vi.mock('@/lib/errors', () => ({
  serviceDisabledError: vi.fn((msg, service) => ({
    toNextResponse: vi.fn(() => new Response(JSON.stringify({ error: msg, service }), { status: 503 })),
  })),
  validationError: vi.fn((msg, details) => ({
    toNextResponse: vi.fn(() => new Response(JSON.stringify({ error: msg, details }), { status: 400 })),
  })),
  permissionDeniedError: vi.fn((msg, projectId) => ({
    toNextResponse: vi.fn(() => new Response(JSON.stringify({ error: msg, projectId }), { status: 403 })),
  })),
  quotaExceededError: vi.fn((msg, projectId, details) => ({
    toNextResponse: vi.fn(() => new Response(JSON.stringify({ error: msg, projectId, details }), { status: 413 })),
  })),
  authenticationError: vi.fn((msg) => ({
    toNextResponse: vi.fn(() => new Response(JSON.stringify({ error: msg }), { status: 401 })),
  })),
  internalError: vi.fn((msg) => ({
    toNextResponse: vi.fn(() => new Response(JSON.stringify({ error: msg }), { status: 500 })),
  })),
}))

vi.mock('@/lib/middleware/correlation', () => ({
  withCorrelationId: vi.fn((req) => 'test-correlation-id'),
  setCorrelationHeader: vi.fn((response, id) => {
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('X-Correlation-ID', id)
    return newResponse
  }),
}))

vi.mock('@/lib/usage/storage-tracking', () => ({
  trackStorageUpload: vi.fn(),
}))

vi.mock('@/features/webhooks', () => ({
  emitEvent: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/storage', () => ({
  uploadFileWithTracking: vi.fn(),
  validateFileName: vi.fn(() => true),
  sanitizeFileName: vi.fn((name) => name),
}))

// Shared test fixtures
const mockPool = {
  query: vi.fn(),
}

const mockAuth = {
  id: 'user-123',
  project_id: 'proj-123',
}

describe('upload-route-module', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handleUpload', () => {
    it('should upload file successfully with valid JWT auth', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      const { uploadFileWithTracking } = await import('@/lib/storage')

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(uploadFileWithTracking).mockResolvedValue({
        id: 'file-123',
        name: 'test.png',
        size: 1024,
        contentType: 'image/png',
        url: 'https://storage.example.com/test.png',
        downloadUrl: 'https://storage.example.com/download/test.png',
        backend: 'telegram',
        totalUsage: 1024,
      })

      // Need to mock getFileBuffer before the request is processed
      // Import and mock the file-handler module
      const fileHandlersModule = await import('../utils/file-handlers')
      vi.spyOn(fileHandlersModule, 'getFileBuffer').mockResolvedValue({
        success: true,
        data: { buffer: Buffer.from('test'), size: 4 },
      } as any)

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({
          file_name: 'test.png',
          file_size: 1024,
          content_type: 'image/png',
          storage_path: '/uploads',
          file_content: Buffer.from('test').toString('base64'),
        }),
      } as unknown as NextRequest

      const response = await handleUpload(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Correlation-ID')).toBe('test-correlation-id')
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.file.name).toBe('test.png')
    })

    it('should fail when storage is disabled', async () => {
      const { checkFeature } = await import('@/lib/features')
      vi.mocked(checkFeature).mockResolvedValueOnce(false)

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({
          file_name: 'test.png',
          file_size: 1024,
          content_type: 'image/png',
        }),
      } as unknown as NextRequest

      const response = await handleUpload(request)

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.error).toContain('disabled')
    })

    it('should fail with missing required fields', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({
          file_name: 'test.png',
          // missing file_size and content_type
        }),
      } as unknown as NextRequest

      const response = await handleUpload(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.details).toBeDefined()
      expect(data.details.missing_fields).toContain('file_size')
      expect(data.details.missing_fields).toContain('content_type')
    })

    it('should fail when file size exceeds maximum', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({
          file_name: 'large.bin',
          file_size: 200 * 1024 * 1024, // 200MB - exceeds 100MB limit
          content_type: 'application/octet-stream',
        }),
      } as unknown as NextRequest

      const response = await handleUpload(request)

      expect(response.status).toBe(413)
      const data = await response.json()
      expect(data.error).toContain('exceeds')
    })

    it('should fail when no authentication provided', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      vi.mocked(authenticateRequest).mockImplementation(() => {
        throw new Error('No token provided')
      })

      const request = {
        headers: {
          get: vi.fn(() => null),
        },
        json: async () => ({
          file_name: 'test.png',
          file_size: 1024,
          content_type: 'image/png',
        }),
      } as unknown as NextRequest

      const response = await handleUpload(request)

      expect(response.status).toBe(401)
    })

    it('should fail with cross-project path access attempt', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      const { validateStoragePath, StorageScopeError } = await import('@/lib/middleware/storage-scope')

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)
      vi.mocked(validateStoragePath).mockImplementation(() => {
        throw new Error(StorageScopeError.CROSS_PROJECT_PATH)
      })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({
          file_name: 'test.png',
          file_size: 1024,
          content_type: 'image/png',
          storage_path: '/other-project/path',
        }),
      } as unknown as NextRequest

      const response = await handleUpload(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('other project')
    })
  })

  describe('handleList', () => {
    it('should return example paths for the project', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuth)

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
      } as unknown as NextRequest

      const response = await handleList(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Correlation-ID')).toBe('test-correlation-id')
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.project_id).toBe('proj-123')
      expect(data.example_paths).toBeDefined()
      expect(data.path_format).toBe('project_id:/path')
    })

    it('should fail when no authentication provided', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      vi.mocked(authenticateRequest).mockImplementation(() => {
        throw new Error('No token provided')
      })

      const request = {
        headers: {
          get: vi.fn(() => null),
        },
      } as unknown as NextRequest

      const response = await handleList(request)

      expect(response.status).toBe(401)
    })

    it('should handle internal errors gracefully', async () => {
      const { authenticateRequest } = await import('@/lib/middleware')
      vi.mocked(authenticateRequest).mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
      } as unknown as NextRequest

      const response = await handleList(request)

      expect(response.status).toBe(500)
    })
  })
})

describe('upload-route-utils', () => {
  describe('validators', () => {
    it('should validate required fields successfully', async () => {
      const { validateRequiredFields } = await import('../utils')

      const result = await validateRequiredFields({
        file_name: 'test.png',
        file_size: 1024,
        content_type: 'image/png',
      })

      expect(result.valid).toBe(true)
    })

    it('should fail validation with missing file_name', async () => {
      const { validateRequiredFields } = await import('../utils')

      const result = await validateRequiredFields({
        file_name: '',
        file_size: 1024,
        content_type: 'image/png',
      })

      expect(result.valid).toBe(false)
      expect(result.details?.missing_fields).toContain('file_name')
    })

    it('should validate file size within limits', async () => {
      const { validateFileSize } = await import('../utils')

      const result = await validateFileSize(1024)
      expect(result.valid).toBe(true)
    })

    it('should fail file size validation for large files', async () => {
      const { validateFileSize } = await import('../utils')

      const result = await validateFileSize(200 * 1024 * 1024)
      expect(result.valid).toBe(false)
      expect(result.details?.max_size).toBe(100 * 1024 * 1024)
    })
  })

  describe('builders', () => {
    it('should build upload response correctly', async () => {
      const { buildUploadResponse } = await import('../utils')

      const response = await buildUploadResponse({
        id: 'file-123',
        name: 'test.png',
        size: 1024,
        contentType: 'image/png',
        url: 'https://example.com/test.png',
        downloadUrl: 'https://example.com/download/test.png',
        backend: 'telegram',
        totalUsage: 1024,
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.file.id).toBe('file-123')
      expect(data.storage_usage.total_mb).toBeCloseTo(0, 0)
    })

    it('should build list response correctly', async () => {
      const { buildListResponse } = await import('../utils')

      const response = await buildListResponse('proj-123', ['proj-123:/uploads/test.png'])

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.project_id).toBe('proj-123')
      expect(data.example_paths).toHaveLength(1)
    })
  })

  describe('getProjectId', () => {
    it('should return project_id from JWT token', async () => {
      const { getProjectId } = await import('../utils')

      const projectId = await getProjectId({ id: 'user-123', project_id: 'proj-123' })

      expect(projectId).toBe('proj-123')
    })

    it('should query database for API key auth', async () => {
      const { getProjectId } = await import('../utils')

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'proj-123' }],
      })

      const projectId = await getProjectId({ id: 'user-123' })

      expect(projectId).toBe('proj-123')
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT id FROM projects WHERE developer_id = $1 LIMIT 1',
        ['user-123']
      )
    })

    it('should throw error when no project found', async () => {
      const { getProjectId } = await import('../utils')

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await expect(getProjectId({ id: 'user-123' })).rejects.toThrow('No project found')
    })
  })
})
