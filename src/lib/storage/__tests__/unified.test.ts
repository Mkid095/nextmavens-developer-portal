/**
 * Unified Storage Interface Tests
 * Tests for the unified storage interface that routes to appropriate backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn() as any

// Helper to get fresh module import
async function importClientModule() {
  vi.resetModules()
  return await import('../client')
}

describe('Unified Storage Interface', () => {
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

  describe('uploadFile', () => {
    it('routes image to Cloudinary', async () => {
      const { uploadFile } = await importClientModule()

      const mockCloudinaryResponse = {
        public_id: 'test-image',
        resource_type: 'image',
        bytes: 10240,
        format: 'jpg',
        url: 'http://test.com/image.jpg',
        secure_url: 'https://test.com/image.jpg',
        original_filename: 'photo.jpg',
        width: 800,
        height: 600,
        version: 123,
        signature: 'sig',
        created_at: new Date().toISOString(),
        tags: [],
        type: 'upload',
        etag: 'etag',
        placeholder: false,
        access_mode: 'public',
      } as any

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCloudinaryResponse,
      })

      const result = await uploadFile(
        'project-123:/uploads/photo.jpg',
        Buffer.from('image'),
        'image/jpeg',
        'photo.jpg'
      )

      expect(result.backend).toBe('cloudinary')
      expect(result.id).toBe('test-image')
    })

    it('routes PDF to Telegram', async () => {
      const { uploadFile } = await importClientModule()

      const mockTelegramResponse = {
        id: 'f_test123',
        name: 'document.pdf',
        size: 1024,
        mimeType: 'application/pdf',
        url: 'https://telegram-api.test.com/files/f_test123',
        downloadUrl: 'https://telegram-api.test.com/files/f_test123/download',
        createdAt: new Date().toISOString(),
        folder: '/uploads',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelegramResponse }),
      })

      const result = await uploadFile(
        'project-123:/uploads/doc.pdf',
        Buffer.from('pdf content'),
        'application/pdf',
        'doc.pdf'
      )

      expect(result.backend).toBe('telegram')
      expect(result.id).toBe('f_test123')
    })
  })

  describe('downloadFile', () => {
    it('downloads from Cloudinary when backend is cloudinary', async () => {
      const { downloadFile } = await importClientModule()

      const fileBuffer = Buffer.from('image data')

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => fileBuffer,
        headers: {
          get: () => 'image/jpeg',
        },
      })

      const result = await downloadFile('public_id', 'cloudinary')

      expect(result.data).toEqual(fileBuffer)
      expect(result.contentType).toBe('image/jpeg')
    })

    it('downloads from Telegram when backend is telegram', async () => {
      const { downloadFile } = await importClientModule()

      const fileBuffer = Buffer.from('file content')

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 302,
          headers: {
            get: (name: string) => {
              if (name === 'Location') return 'https://cdn.test.com/file'
              return null
            },
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => fileBuffer,
          headers: {
            get: () => 'application/pdf',
          },
        })

      const result = await downloadFile('f_test123', 'telegram')

      expect(result.data).toEqual(fileBuffer)
      expect(result.contentType).toBe('application/pdf')
    })
  })

  describe('fileExists', () => {
    it('returns true when Cloudinary file exists', async () => {
      const { fileExists } = await importClientModule()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
      })

      const result = await fileExists('public_id', 'cloudinary')
      expect(result).toBe(true)
    })

    it('returns false when Cloudinary file not found', async () => {
      const { fileExists } = await importClientModule()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        headers: new Headers(),
      })

      const result = await fileExists('nonexistent', 'cloudinary')
      expect(result).toBe(false)
    })

    it('returns true when Telegram file exists', async () => {
      const { fileExists } = await importClientModule()

      const mockResponse = {
        id: 'f_test123',
        name: 'test.pdf',
        size: 1024,
        mimeType: 'application/pdf',
        url: 'https://telegram-api.test.com/files/f_test123',
        downloadUrl: 'https://telegram-api.test.com/files/f_test123/download',
        createdAt: new Date().toISOString(),
        folder: '/uploads',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      })

      const result = await fileExists('f_test123', 'telegram')
      expect(result).toBe(true)
    })
  })

  describe('deleteFile', () => {
    it('deletes from Cloudinary', async () => {
      const { deleteFile } = await importClientModule()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
      })

      await expect(deleteFile('public_id', 'cloudinary')).resolves.not.toThrow()
    })

    it('deletes from Telegram', async () => {
      const { deleteFile } = await importClientModule()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
      })

      await expect(deleteFile('f_test123', 'telegram')).resolves.not.toThrow()
    })
  })
})
