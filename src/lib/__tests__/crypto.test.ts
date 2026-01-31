/**
 * Tests for crypto utilities
 *
 * Tests API key generation and hashing
 */

import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

describe('Crypto Utilities', () => {
  describe('API Key Generation', () => {
    const generateApiKey = (): string => {
      return Buffer.from(crypto.randomBytes(32)).toString('hex')
    }

    const hashApiKey = (key: string): string => {
      return crypto.createHash('sha256').update(key).digest('hex')
    }

    it('should generate unique API keys', () => {
      const keys = new Set<string>()

      for (let i = 0; i < 100; i++) {
        keys.add(generateApiKey())
      }

      expect(keys.size).toBe(100)
    })

    it('should generate keys of correct length', () => {
      const key = generateApiKey()

      expect(key).toHaveLength(64)
      expect(/^[a-f0-9]{64}$/.test(key)).toBe(true)
    })

    it('should hash keys consistently', () => {
      const key = 'test-api-key-12345'
      const hash1 = hashApiKey(key)
      const hash2 = hashApiKey(key)

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different keys', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()
      const hash1 = hashApiKey(key1)
      const hash2 = hashApiKey(key2)

      expect(hash1).not.toBe(hash2)
    })

    it('should produce SHA-256 hashes', () => {
      const key = 'any-key'
      const hash = hashApiKey(key)

      expect(hash).toHaveLength(64)
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true)
    })

    it('should not be reversible', () => {
      const key = generateApiKey()
      const hash = hashApiKey(key)

      expect(hash).not.toContain(key)
      expect(hash).not.toHaveLength(key.length)
    })
  })

  describe('HMAC Signature Generation', () => {
    const generateSignature = (secret: string, payload: Record<string, unknown>): string => {
      const payloadString = JSON.stringify(payload)
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payloadString)
      const signature = hmac.digest('hex')
      return `sha256=${signature}`
    }

    it('should generate consistent signatures', () => {
      const secret = 'test-secret'
      const payload = { foo: 'bar' }

      const sig1 = generateSignature(secret, payload)
      const sig2 = generateSignature(secret, payload)

      expect(sig1).toBe(sig2)
    })

    it('should generate different signatures for different payloads', () => {
      const secret = 'test-secret'

      const sig1 = generateSignature(secret, { foo: 'bar' })
      const sig2 = generateSignature(secret, { foo: 'baz' })

      expect(sig1).not.toBe(sig2)
    })

    it('should include sha256 prefix', () => {
      const signature = generateSignature('secret', { data: 'test' })

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/)
    })

    it('should generate different signatures for different secrets', () => {
      const payload = { data: 'test' }

      const sig1 = generateSignature('secret1', payload)
      const sig2 = generateSignature('secret2', payload)

      expect(sig1).not.toBe(sig2)
    })
  })
})
