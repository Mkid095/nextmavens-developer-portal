/**
 * Tests for auth library
 *
 * Tests JWT token generation, validation, and API key authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  generateApiKey,
  hashApiKey,
  generateSlug,
  type Developer,
  type JwtPayload,
} from '@/lib/auth'
import { getPool } from '@/lib/db'

// Mock the database
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

// Mock console.error to avoid noise
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

describe('JWT Token Generation', () => {
  const mockDeveloper: Developer = {
    id: 'dev-123',
    email: 'test@example.com',
    name: 'Test Developer',
    organization: 'Test Org',
  }

  describe('generateAccessToken', () => {
    it('should generate a valid access token with project_id', () => {
      const projectId = 'project-456'
      const token = generateAccessToken(mockDeveloper, projectId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      // Verify the token can be decoded
      const decoded = verifyAccessToken(token)
      expect(decoded.id).toBe(mockDeveloper.id)
      expect(decoded.email).toBe(mockDeveloper.email)
      expect(decoded.project_id).toBe(projectId)
    })

    it('should include all required fields in JWT payload', () => {
      const projectId = 'project-789'
      const token = generateAccessToken(mockDeveloper, projectId)
      const decoded = verifyAccessToken(token)

      expect(decoded).toHaveProperty('id')
      expect(decoded).toHaveProperty('email')
      expect(decoded).toHaveProperty('project_id')
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const developerId = 'dev-123'
      const token = generateRefreshToken(developerId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique tokens for each call', () => {
      const developerId = 'dev-123'
      // Use fake timers to ensure different timestamps
      vi.useFakeTimers()
      const token1 = generateRefreshToken(developerId)
      vi.advanceTimersByTime(1000) // Advance by 1 second
      const token2 = generateRefreshToken(developerId)
      vi.useRealTimers()

      // Tokens should be different due to timestamp in JWT
      expect(token1).not.toBe(token2)
    })
  })
})

describe('JWT Token Verification', () => {
  const mockDeveloper: Developer = {
    id: 'dev-123',
    email: 'test@example.com',
    name: 'Test Developer',
  }

  it('should verify a valid access token', () => {
    const projectId = 'project-456'
    const token = generateAccessToken(mockDeveloper, projectId)

    const decoded = verifyAccessToken(token)

    expect(decoded.id).toBe(mockDeveloper.id)
    expect(decoded.email).toBe(mockDeveloper.email)
    expect(decoded.project_id).toBe(projectId)
  })

  it('should throw error for invalid token', () => {
    expect(() => {
      verifyAccessToken('invalid-token')
    }).toThrow()
  })

  it('should throw error for malformed token', () => {
    expect(() => {
      verifyAccessToken('not.a.jwt.token')
    }).toThrow()
  })

  it('should throw error for token without project_id', () => {
    // Create a token without project_id (should not happen in normal flow)
    const jwt = require('jsonwebtoken')
    const tokenWithoutProjectId = jwt.sign(
      { id: mockDeveloper.id, email: mockDeveloper.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )

    expect(() => {
      verifyAccessToken(tokenWithoutProjectId)
    }).toThrow('Missing project_id claim')
  })

  it('should throw error for expired token', () => {
    const jwt = require('jsonwebtoken')
    const expiredToken = jwt.sign(
      {
        id: mockDeveloper.id,
        email: mockDeveloper.email,
        project_id: 'project-456',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Expired
    )

    expect(() => {
      verifyAccessToken(expiredToken)
    }).toThrow('Invalid or expired token')
  })
})

describe('API Key Generation', () => {
  describe('generateApiKey', () => {
    it('should generate a public API key', () => {
      const key = generateApiKey('public')

      expect(key).toBeDefined()
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    })

    it('should generate a secret API key', () => {
      const key = generateApiKey('secret')

      expect(key).toBeDefined()
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    })

    it('should generate unique keys', () => {
      const key1 = generateApiKey('public')
      const key2 = generateApiKey('public')

      expect(key1).not.toBe(key2)
    })

    it('should generate keys of expected length (64 hex chars)', () => {
      const key = generateApiKey('public')

      // 32 random bytes = 64 hex characters
      expect(key.length).toBe(64)
      expect(/^[a-f0-9]{64}$/.test(key)).toBe(true)
    })
  })

  describe('hashApiKey', () => {
    it('should hash an API key', () => {
      const key = generateApiKey('public')
      const hash = hashApiKey(key)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce consistent hash for same key', () => {
      const key = 'test-api-key-12345'
      const hash1 = hashApiKey(key)
      const hash2 = hashApiKey(key)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different keys', () => {
      const key1 = generateApiKey('public')
      const key2 = generateApiKey('public')
      const hash1 = hashApiKey(key1)
      const hash2 = hashApiKey(key2)

      expect(hash1).not.toBe(hash2)
    })

    it('should produce SHA-256 hash (64 hex chars)', () => {
      const key = 'test-key'
      const hash = hashApiKey(key)

      expect(hash.length).toBe(64)
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true)
    })
  })
})

describe('Slug Generation', () => {
  it('should generate slug from simple name', () => {
    const slug = generateSlug('My Project')

    expect(slug).toBe('my-project')
  })

  it('should handle multiple spaces', () => {
    const slug = generateSlug('My   Awesome   Project')

    expect(slug).toBe('my-awesome-project')
  })

  it('should handle special characters', () => {
    const slug = generateSlug('My @Awesome #Project!')

    expect(slug).toBe('my-awesome-project')
  })

  it('should truncate to 50 characters', () => {
    const longName = 'a'.repeat(100)
    const slug = generateSlug(longName)

    expect(slug.length).toBe(50)
  })

  it('should handle leading/trailing special chars', () => {
    expect(generateSlug('---test---')).toBe('test')
    expect(generateSlug('!!!test!!!')).toBe('test')
  })

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('should handle numbers', () => {
    expect(generateSlug('Project 123')).toBe('project-123')
  })
})

describe('Type Safety', () => {
  it('JwtPayload should have correct types', () => {
    const payload: JwtPayload = {
      id: 'test-id',
      email: 'test@example.com',
      project_id: 'project-123',
    }

    expect(typeof payload.id).toBe('string')
    expect(typeof payload.email).toBe('string')
    expect(typeof payload.project_id).toBe('string')
  })

  it('Developer should have correct types', () => {
    const developer: Developer = {
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test Name',
    }

    expect(typeof developer.id).toBe('string')
    expect(typeof developer.email).toBe('string')
    expect(typeof developer.name).toBe('string')
    expect(developer.organization).toBeUndefined()
  })
})
