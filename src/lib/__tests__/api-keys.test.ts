/**
 * Tests for API Key functionality
 *
 * Tests API key generation, hashing, and validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateApiKey, hashApiKey } from '@/lib/auth'

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

    it('should generate unique keys for each call', () => {
      const keys = new Set()

      for (let i = 0; i < 100; i++) {
        keys.add(generateApiKey('public'))
      }

      // All 100 keys should be unique
      expect(keys.size).toBe(100)
    })

    it('should generate keys of 64 hex characters', () => {
      const publicKey = generateApiKey('public')
      const secretKey = generateApiKey('secret')

      expect(publicKey.length).toBe(64)
      expect(secretKey.length).toBe(64)

      // Should be valid hex
      expect(/^[a-f0-9]{64}$/.test(publicKey)).toBe(true)
      expect(/^[a-f0-9]{64}$/.test(secretKey)).toBe(true)
    })

    it('should be cryptographically random (no collisions)', () => {
      const keys: string[] = []

      for (let i = 0; i < 1000; i++) {
        keys.push(generateApiKey('public'))
      }

      // Check for duplicates
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(1000)
    })
  })

  describe('hashApiKey', () => {
    it('should hash an API key', () => {
      const key = generateApiKey('public')
      const hash = hashApiKey(key)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBe(64)
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
      const key = 'any-key'
      const hash = hashApiKey(key)

      expect(hash.length).toBe(64)
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true)
    })

    it('should not be reversible', () => {
      const key = generateApiKey('public')
      const hash = hashApiKey(key)

      // Hash should not be equal to the original key (different content)
      expect(hash).not.toBe(key)
      // Hash should not contain the original key
      expect(hash).not.toContain(key)
    })

    it('should handle empty string', () => {
      const hash = hashApiKey('')

      expect(hash).toBeDefined()
      expect(hash.length).toBe(64)
    })

    it('should handle special characters', () => {
      const specialKeys = [
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots',
        'key/with/slashes',
        'key@with#special$chars',
      ]

      specialKeys.forEach(key => {
        const hash = hashApiKey(key)
        expect(hash).toBeDefined()
        expect(hash.length).toBe(64)
      })
    })
  })

  describe('API Key Security', () => {
    it('should not expose raw key in hash', () => {
      const key = generateApiKey('secret')
      const hash = hashApiKey(key)

      // The hash should not reveal the original key
      expect(hash).not.toBe(key)
      expect(key).not.toContain(hash)
    })

    it('should generate different public and secret keys', () => {
      const publicKey = generateApiKey('public')
      const secretKey = generateApiKey('secret')

      expect(publicKey).not.toBe(secretKey)
    })

    it('should generate keys with sufficient entropy', () => {
      // 32 random bytes = 256 bits of entropy
      const keys: string[] = []

      for (let i = 0; i < 1000; i++) {
        keys.push(generateApiKey('public'))
      }

      // Check character distribution is uniform-ish
      const allChars = keys.join('')
      const charCounts: Record<string, number> = {}

      for (const char of allChars) {
        charCounts[char] = (charCounts[char] || 0) + 1
      }

      // Each hex character should appear roughly the same number of times
      // With 64000 chars (1000 * 64), each of 16 hex chars should appear ~4000 times
      const counts = Object.values(charCounts)
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length

      // Allow for 10% variance
      counts.forEach(count => {
        expect(count).toBeGreaterThan(avgCount * 0.9)
        expect(count).toBeLessThan(avgCount * 1.1)
      })
    })
  })
})
