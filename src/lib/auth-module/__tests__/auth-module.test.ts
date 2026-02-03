/**
 * Authentication Library Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../jwt'
import {
  authenticateApiKey,
  logApiKeyUsage,
} from '../api-key'
import {
  generateSlug,
  generateApiKey,
  hashApiKey,
} from '../utils'
import {
  checkProjectStatus,
} from '../project-status'
import {
  getJwtSecret,
  getRefreshSecret,
  TOKEN_EXPIRATION,
} from '../constants'
import type { Developer, JwtPayload } from '../types'
import { getPool } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

vi.mock('@/lib/key-usage-tracking', () => ({
  logApiUsage: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/types/project-lifecycle.types', () => ({
  ProjectStatus: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    ARCHIVED: 'archived',
    DELETED: 'deleted',
  },
  keysWorkForStatus: vi.fn((status: string) => ['active'].includes(status)),
  getErrorCodeForStatus: vi.fn((status: string) => `PROJECT_${status.toUpperCase()}`),
}))

describe('auth-module', () => {
  const mockPool = {
    query: vi.fn(),
  }

  const mockDeveloper: Developer = {
    id: 'dev-123',
    email: 'test@example.com',
    name: 'Test Developer',
    organization: 'Test Org',
  }

  const mockProjectId = 'proj-123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('jwt - generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(mockDeveloper, mockProjectId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Verify token can be decoded
      const decoded = jwt.decode(token) as JwtPayload
      expect(decoded).toBeDefined()
      expect(decoded.id).toBe(mockDeveloper.id)
      expect(decoded.email).toBe(mockDeveloper.email)
      expect(decoded.project_id).toBe(mockProjectId)
    })

    it('should include correct expiration in token', () => {
      const token = generateAccessToken(mockDeveloper, mockProjectId)
      const decoded = jwt.decode(token) as JwtPayload

      expect(decoded.exp).toBeDefined()
      // Token should expire approximately 1 hour from now
      const now = Math.floor(Date.now() / 1000)
      const expectedExp = now + (60 * 60) // 1 hour
      expect(decoded.exp).toBeGreaterThan(now)
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 10) // Allow 10 second buffer
    })
  })

  describe('jwt - generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(mockDeveloper.id)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Verify token can be decoded
      const decoded = jwt.decode(token) as { id: string }
      expect(decoded).toBeDefined()
      expect(decoded.id).toBe(mockDeveloper.id)
    })

    it('should include longer expiration for refresh token', () => {
      const token = generateRefreshToken(mockDeveloper.id)
      const decoded = jwt.decode(token) as { exp: number }

      // Refresh token should expire approximately 7 days from now
      const now = Math.floor(Date.now() / 1000)
      const expectedExp = now + (7 * 24 * 60 * 60) // 7 days
      expect(decoded.exp).toBeGreaterThan(now)
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 10)
    })
  })

  describe('jwt - verifyAccessToken', () => {
    it('should verify and return valid access token payload', () => {
      const token = generateAccessToken(mockDeveloper, mockProjectId)

      const decoded = verifyAccessToken(token)

      expect(decoded.id).toBe(mockDeveloper.id)
      expect(decoded.email).toBe(mockDeveloper.email)
      expect(decoded.project_id).toBe(mockProjectId)
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow()
    })

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { id: mockDeveloper.id, email: mockDeveloper.email, project_id: mockProjectId },
        getJwtSecret(),
        { expiresIn: '-1h' }
      )

      expect(() => verifyAccessToken(expiredToken)).toThrow()
    })

    it('should throw error for token without project_id', () => {
      const tokenWithoutProjectId = jwt.sign(
        { id: mockDeveloper.id, email: mockDeveloper.email },
        getJwtSecret(),
        { expiresIn: '1h' }
      )

      expect(() => verifyAccessToken(tokenWithoutProjectId)).toThrow()
    })

    it('should throw error for token with string payload', () => {
      const stringToken = jwt.sign('just-a-string', getJwtSecret())

      expect(() => verifyAccessToken(stringToken)).toThrow()
    })
  })

  describe('jwt - verifyRefreshToken', () => {
    it('should verify and return valid refresh token payload', () => {
      const token = generateRefreshToken(mockDeveloper.id)

      const decoded = verifyRefreshToken(token)

      expect(decoded.id).toBe(mockDeveloper.id)
    })

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow()
    })

    it('should throw error for expired refresh token', () => {
      const expiredToken = jwt.sign(
        { id: mockDeveloper.id },
        getRefreshSecret(),
        { expiresIn: '-1d' }
      )

      expect(() => verifyRefreshToken(expiredToken)).toThrow()
    })
  })

  describe('api-key - authenticateApiKey', () => {
    const mockApiKey = 'nm_live_pk_test123abc456'
    const mockHashedKey = 'abc123hash'

    beforeEach(() => {
      vi.doMock('../utils', () => ({
        hashApiKey: vi.fn(() => mockHashedKey),
      }))
    })

    it('should authenticate valid API key successfully', async () => {
      const { hashApiKey } = await import('../utils')
      vi.mocked(hashApiKey).mockReturnValue(mockHashedKey)

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'key-123',
          project_id: 'proj-123',
          developer_id: 'dev-123',
          key_type: 'public',
          key_prefix: 'nm_live_pk',
          scopes: ['db:select'],
          environment: 'live',
          name: 'Test Key',
          created_at: new Date(),
          status: 'active',
          expires_at: null,
        }],
      })

      // Mock checkProjectStatus to pass
      const { checkProjectStatus: mockCheckProjectStatus } = await import('../project-status')
      vi.spyOn(await import('../project-status'), 'checkProjectStatus').mockResolvedValue(undefined)

      const result = await authenticateApiKey(mockApiKey)

      expect(result.id).toBe('key-123')
      expect(result.project_id).toBe('proj-123')
      expect(result.developer_id).toBe('dev-123')
      expect(result.key_type).toBe('public')
    })

    it('should throw error for non-existent API key', async () => {
      const { hashApiKey } = await import('../utils')
      vi.mocked(hashApiKey).mockReturnValue(mockHashedKey)

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await expect(authenticateApiKey(mockApiKey)).rejects.toThrow()
    })

    it('should throw error for revoked API key', async () => {
      const { hashApiKey } = await import('../utils')
      vi.mocked(hashApiKey).mockReturnValue(mockHashedKey)

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'key-123',
          project_id: 'proj-123',
          developer_id: 'dev-123',
          key_type: 'public',
          key_prefix: 'nm_live_pk',
          scopes: ['db:select'],
          environment: 'live',
          name: 'Test Key',
          created_at: new Date(),
          status: 'revoked',
          expires_at: null,
        }],
      })

      // Mock checkProjectStatus to pass
      vi.spyOn(await import('../project-status'), 'checkProjectStatus').mockResolvedValue(undefined)

      await expect(authenticateApiKey(mockApiKey)).rejects.toThrow()
    })

    it('should throw error for expired API key', async () => {
      const { hashApiKey } = await import('../utils')
      vi.mocked(hashApiKey).mockReturnValue(mockHashedKey)

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'key-123',
          project_id: 'proj-123',
          developer_id: 'dev-123',
          key_type: 'public',
          key_prefix: 'nm_live_pk',
          scopes: ['db:select'],
          environment: 'live',
          name: 'Test Key',
          created_at: new Date(),
          status: 'active',
          expires_at: new Date('2020-01-01'), // Past date
        }],
      })

      // Mock checkProjectStatus to pass
      vi.spyOn(await import('../project-status'), 'checkProjectStatus').mockResolvedValue(undefined)

      await expect(authenticateApiKey(mockApiKey)).rejects.toThrow()
    })

    it('should update key usage asynchronously after authentication', async () => {
      const { hashApiKey } = await import('../utils')
      vi.mocked(hashApiKey).mockReturnValue(mockHashedKey)

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'key-123',
            project_id: 'proj-123',
            developer_id: 'dev-123',
            key_type: 'public',
            key_prefix: 'nm_live_pk',
            scopes: ['db:select'],
            environment: 'live',
            name: 'Test Key',
            created_at: new Date(),
            status: 'active',
            expires_at: null,
          }],
        })
        .mockResolvedValueOnce({ rows: [] }) // updateKeyUsage call

      // Mock checkProjectStatus to pass
      vi.spyOn(await import('../project-status'), 'checkProjectStatus').mockResolvedValue(undefined)

      const result = await authenticateApiKey(mockApiKey)

      expect(result).toBeDefined()
      // Wait a bit for async update
      await new Promise(resolve => setTimeout(resolve, 10))
    })
  })

  describe('api-key - logApiKeyUsage', () => {
    it('should log API key usage asynchronously', async () => {
      const { logApiUsage } = await import('@/lib/key-usage-tracking')

      await logApiKeyUsage('key-123', 'proj-123', '/api/test', 'GET', 200, 150)

      expect(logApiUsage).toHaveBeenCalledWith({
        key_id: 'key-123',
        project_id: 'proj-123',
        endpoint: '/api/test',
        method: 'GET',
        status_code: 200,
        response_time_ms: 150,
      })
    })

    it('should log usage without response time', async () => {
      const { logApiUsage } = await import('@/lib/key-usage-tracking')

      await logApiKeyUsage('key-123', 'proj-123', '/api/test', 'POST', 201)

      expect(logApiUsage).toHaveBeenCalledWith({
        key_id: 'key-123',
        project_id: 'proj-123',
        endpoint: '/api/test',
        method: 'POST',
        status_code: 201,
        response_time_ms: undefined,
      })
    })
  })

  describe('utils - generateSlug', () => {
    it('should convert name to URL-safe slug', () => {
      expect(generateSlug('Test Project')).toBe('test-project')
      expect(generateSlug('Hello World API')).toBe('hello-world-api')
    })

    it('should handle special characters', () => {
      expect(generateSlug('Test@Project#123')).toBe('test-project-123')
      expect(generateSlug('Multiple---Dashes')).toBe('multiple-dashes')
    })

    it('should trim leading/trailing dashes', () => {
      expect(generateSlug('---Test---')).toBe('test')
    })

    it('should limit slug length to 50 characters', () => {
      const longName = 'a'.repeat(100)
      const slug = generateSlug(longName)
      expect(slug.length).toBeLessThanOrEqual(50)
    })

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('')
    })
  })

  describe('utils - generateApiKey', () => {
    it('should generate 64-character hex string for public key', () => {
      const key = generateApiKey('public')
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate 64-character hex string for secret key', () => {
      const key = generateApiKey('secret')
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate unique keys', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()
      expect(key1).not.toBe(key2)
    })

    it('should default to public type', () => {
      const key = generateApiKey()
      expect(key).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('utils - hashApiKey', () => {
    it('should hash API key using SHA-256', () => {
      const key = 'test-api-key-123'
      const hash = hashApiKey(key)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBe(64) // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should produce consistent hash for same input', () => {
      const key = 'test-api-key-123'
      const hash1 = hashApiKey(key)
      const hash2 = hashApiKey(key)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashApiKey('key-1')
      const hash2 = hashApiKey('key-2')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('project-status - checkProjectStatus', () => {
    it('should pass for active project', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ status: 'active' }],
      })

      await expect(checkProjectStatus('proj-123')).resolves.toBeUndefined()
    })

    it('should throw error for suspended project', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ status: 'suspended' }],
      })

      await expect(checkProjectStatus('proj-123')).rejects.toThrow()
    })

    it('should throw error for archived project', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ status: 'archived' }],
      })

      await expect(checkProjectStatus('proj-123')).rejects.toThrow()
    })

    it('should throw error for deleted project', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ status: 'deleted' }],
      })

      await expect(checkProjectStatus('proj-123')).rejects.toThrow()
    })

    it('should throw error when project not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await expect(checkProjectStatus('proj-123')).rejects.toThrow()
    })
  })

  describe('constants', () => {
    it('should return JWT secret', () => {
      const secret = getJwtSecret()
      expect(secret).toBeDefined()
      expect(typeof secret).toBe('string')
    })

    it('should return refresh token secret', () => {
      const secret = getRefreshSecret()
      expect(secret).toBeDefined()
      expect(typeof secret).toBe('string')
    })

    it('should have correct token expiration times', () => {
      expect(TOKEN_EXPIRATION.ACCESS_TOKEN).toBe('1h')
      expect(TOKEN_EXPIRATION.REFRESH_TOKEN).toBe('7d')
    })
  })
})
