/**
 * Content Type Routing Tests
 * Tests for content type detection and routing logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn() as any

// Helper to get fresh module import - resets module cache to pick up new env vars
async function importClientModule() {
  vi.resetModules()
  return await import('../client')
}

describe('Content Type Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('TELEGRAM_STORAGE_API_URL', 'https://telegram-api.test.com')
    vi.stubEnv('TELEGRAM_STORAGE_API_KEY', 'test-telegram-key')
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud')
    vi.stubEnv('CLOUDINARY_UPLOAD_PRESET', 'test-preset')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('shouldUseCloudinary', () => {
    it('returns true for image types', async () => {
      const { shouldUseCloudinary } = await importClientModule()
      expect(shouldUseCloudinary('image/jpeg')).toBe(true)
      expect(shouldUseCloudinary('image/png')).toBe(true)
      expect(shouldUseCloudinary('image/webp')).toBe(true)
      expect(shouldUseCloudinary('image/svg+xml')).toBe(true)
    })

    it('returns true for video types', async () => {
      const { shouldUseCloudinary } = await importClientModule()
      expect(shouldUseCloudinary('video/mp4')).toBe(true)
      expect(shouldUseCloudinary('video/webm')).toBe(true)
      expect(shouldUseCloudinary('video/mov')).toBe(true)
    })

    it('returns true for audio types', async () => {
      const { shouldUseCloudinary } = await importClientModule()
      expect(shouldUseCloudinary('audio/mp3')).toBe(true)
      expect(shouldUseCloudinary('audio/wav')).toBe(true)
      expect(shouldUseCloudinary('audio/ogg')).toBe(true)
    })

    it('returns false for document types', async () => {
      const { shouldUseCloudinary } = await importClientModule()
      expect(shouldUseCloudinary('application/pdf')).toBe(false)
      expect(shouldUseCloudinary('application/zip')).toBe(false)
      expect(shouldUseCloudinary('text/plain')).toBe(false)
    })

    it('is case insensitive', async () => {
      const { shouldUseCloudinary } = await importClientModule()
      expect(shouldUseCloudinary('IMAGE/JPEG')).toBe(true)
      expect(shouldUseCloudinary('Image/PNG')).toBe(true)
    })
  })

  describe('shouldUseTelegram', () => {
    it('returns true for document types', async () => {
      const { shouldUseTelegram } = await importClientModule()
      expect(shouldUseTelegram('application/pdf')).toBe(true)
      expect(shouldUseTelegram('application/zip')).toBe(true)
      expect(shouldUseTelegram('text/plain')).toBe(true)
    })

    it('returns false for image types', async () => {
      const { shouldUseTelegram } = await importClientModule()
      expect(shouldUseTelegram('image/jpeg')).toBe(false)
      expect(shouldUseTelegram('image/png')).toBe(false)
    })
  })

  describe('MAX_FILE_SIZE', () => {
    it('has correct telegram limit', async () => {
      const { MAX_FILE_SIZE } = await importClientModule()
      expect(MAX_FILE_SIZE.telegram).toBe(1.5 * 1024 * 1024 * 1024) // 1.5GB
    })

    it('has correct cloudinary limit', async () => {
      const { MAX_FILE_SIZE } = await importClientModule()
      expect(MAX_FILE_SIZE.cloudinary).toBe(10 * 1024 * 1024) // 10MB
    })
  })
})
