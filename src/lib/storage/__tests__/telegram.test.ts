/**
 * Telegram Storage API Tests
 * Tests for Telegram storage backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn() as any

// Helper to get fresh module import
async function importClientModule() {
  vi.resetModules()
  return await import('../client')
}

describe('Telegram Storage API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('TELEGRAM_STORAGE_API_URL', 'https://telegram-api.test.com')
    vi.stubEnv('TELEGRAM_STORAGE_API_KEY', 'test-telegram-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('uploadToTelegram', () => {
    it('uploads file successfully', async () => {
      const { uploadToTelegram } = await importClientModule()

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

      const result = await uploadToTelegram(
        'project-123:/uploads/test.pdf',
        Buffer.from('test content'),
        'application/pdf',
        'test.pdf'
      )

      expect(result.id).toBe('f_test123')
      expect(result.name).toBe('test.pdf')
      expect(result.size).toBe(1024)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('telegram-api.test.com/api/files'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-telegram-key',
          }),
        })
      )
    })

    it('throws error when file size exceeds limit', async () => {
      const { uploadToTelegram, MAX_FILE_SIZE } = await importClientModule()
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE.telegram + 1)

      await expect(
        uploadToTelegram(
          'project-123:/uploads/large.pdf',
          largeBuffer,
          'application/pdf',
          'large.pdf'
        )
      ).rejects.toThrow('File size exceeds Telegram limit')
    })

    it('throws error on API failure', async () => {
      const { uploadToTelegram } = await importClientModule()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Upload failed' }),
      })

      await expect(
        uploadToTelegram(
          'project-123:/uploads/test.pdf',
          Buffer.from('test'),
          'application/pdf',
          'test.pdf'
        )
      ).rejects.toThrow('Telegram upload failed')
    })
  })

  describe('downloadFromTelegram', () => {
    it('downloads file successfully', async () => {
      const { downloadFromTelegram } = await importClientModule()

      const fileBuffer = Buffer.from('downloaded content')

      // Mock redirect response
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 302,
          headers: {
            get: (name: string) => {
              if (name === 'Location' || name === 'location') {
                return 'https://cdn.telegram.com/file/test.pdf'
              }
              return null
            },
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => fileBuffer,
          headers: {
            get: (name: string) => {
              if (name === 'content-type') {
                return 'application/pdf'
              }
              return null
            },
          },
        })

      const result = await downloadFromTelegram('f_test123')

      expect(result.data).toEqual(fileBuffer)
      expect(result.contentType).toBe('application/pdf')
      expect(result.fileName).toBeDefined()
    })

    it('handles redirect with Location header', async () => {
      const { downloadFromTelegram } = await importClientModule()

      const fileBuffer = Buffer.from('content')

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
          headers: new Headers(),
        })

      const result = await downloadFromTelegram('f_test123')
      expect(result.data).toEqual(fileBuffer)
    })

    it('gets file info when no redirect', async () => {
      const { downloadFromTelegram } = await importClientModule()

      const fileBuffer = Buffer.from('content')
      const mockInfo = {
        url: 'https://cdn.test.com/file.pdf',
        downloadUrl: 'https://cdn.test.com/file.pdf/download',
        mimeType: 'application/pdf',
        name: 'test.pdf',
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockInfo }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => fileBuffer,
          headers: {
            get: () => 'application/pdf',
          },
        })

      const result = await downloadFromTelegram('f_test123')
      expect(result.data).toEqual(fileBuffer)
      expect(result.contentType).toBe('application/pdf')
    })
  })

  describe('getTelegramFileInfo', () => {
    it('gets file metadata', async () => {
      const { getTelegramFileInfo } = await importClientModule()

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

      const result = await getTelegramFileInfo('f_test123')

      expect(result.id).toBe('f_test123')
      expect(result.name).toBe('test.pdf')
    })

    it('throws error on API failure', async () => {
      const { getTelegramFileInfo } = await importClientModule()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(getTelegramFileInfo('f_nonexistent')).rejects.toThrow('Failed to get file info')
    })
  })

  describe('deleteFromTelegram', () => {
    it('deletes file successfully', async () => {
      const { deleteFromTelegram } = await importClientModule()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
      })

      await expect(deleteFromTelegram('f_test123')).resolves.not.toThrow()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/files/f_test123'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-telegram-key',
          }),
        })
      )
    })
  })

  describe('listTelegramFiles', () => {
    it('lists files in a folder', async () => {
      const { listTelegramFiles } = await importClientModule()

      const mockFiles = [
        {
          id: 'f_001',
          name: 'file1.pdf',
          size: 1024,
          mimeType: 'application/pdf',
          url: 'https://telegram-api.test.com/files/f_001',
          downloadUrl: 'https://telegram-api.test.com/files/f_001/download',
          createdAt: new Date().toISOString(),
          folder: '/uploads',
        },
        {
          id: 'f_002',
          name: 'file2.pdf',
          size: 2048,
          mimeType: 'application/pdf',
          url: 'https://telegram-api.test.com/files/f_002',
          downloadUrl: 'https://telegram-api.test.com/files/f_002/download',
          createdAt: new Date().toISOString(),
          folder: '/uploads',
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: mockFiles,
            total: 2,
            hasMore: false,
          },
        }),
      })

      const result = await listTelegramFiles('/uploads', 100)

      expect(result.files).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(result.files[0].id).toBe('f_001')
    })
  })
})
