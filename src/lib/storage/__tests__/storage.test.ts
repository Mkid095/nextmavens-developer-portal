/**
 * Storage Service Unit Tests
 *
 * Comprehensive unit tests for the storage service client library.
 * Tests Telegram Storage API and Cloudinary client with mocks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  uploadFile,
  uploadToTelegram,
  uploadToCloudinary,
  downloadFile,
  downloadFromTelegram,
  deleteFile,
  deleteFromTelegram,
  fileExists,
  getTelegramFileInfo,
  listTelegramFiles,
  getCloudinaryUrl,
  shouldUseCloudinary,
  shouldUseTelegram,
  MAX_FILE_SIZE,
  CLOUDINARY_MIME_TYPES,
  type TelegramFileResponse,
  type CloudinaryUploadResponse,
} from '../client'

// Mock fetch globally
global.fetch = vi.fn() as any

// Mock environment variables
const mockEnv = {
  TELEGRAM_STORAGE_API_URL: 'https://telegram-api.test.com',
  TELEGRAM_STORAGE_API_KEY: 'test-telegram-key',
  CLOUDINARY_CLOUD_NAME: 'test-cloud',
  CLOUDINARY_UPLOAD_PRESET: 'test-preset',
}

describe('Storage Client - Content Type Routing', () => {
  beforeEach(() => {
    vi.resetModules()
    // Mock environment variables
    process.env.TELEGRAM_STORAGE_API_URL = mockEnv.TELEGRAM_STORAGE_API_URL
    process.env.TELEGRAM_STORAGE_API_KEY = mockEnv.TELEGRAM_STORAGE_API_KEY
    process.env.CLOUDINARY_CLOUD_NAME = mockEnv.CLOUDINARY_CLOUD_NAME
    process.env.CLOUDINARY_UPLOAD_PRESET = mockEnv.CLOUDINARY_UPLOAD_PRESET
    vi.clearAllMocks()
  })

  describe('shouldUseCloudinary', () => {
    it('returns true for image types', () => {
      expect(shouldUseCloudinary('image/jpeg')).toBe(true)
      expect(shouldUseCloudinary('image/png')).toBe(true)
      expect(shouldUseCloudinary('image/webp')).toBe(true)
      expect(shouldUseCloudinary('image/svg+xml')).toBe(true)
    })

    it('returns true for video types', () => {
      expect(shouldUseCloudinary('video/mp4')).toBe(true)
      expect(shouldUseCloudinary('video/webm')).toBe(true)
      expect(shouldUseCloudinary('video/mov')).toBe(true)
    })

    it('returns true for audio types', () => {
      expect(shouldUseCloudinary('audio/mp3')).toBe(true)
      expect(shouldUseCloudinary('audio/wav')).toBe(true)
      expect(shouldUseCloudinary('audio/ogg')).toBe(true)
    })

    it('returns false for document types', () => {
      expect(shouldUseCloudinary('application/pdf')).toBe(false)
      expect(shouldUseCloudinary('application/zip')).toBe(false)
      expect(shouldUseCloudinary('text/plain')).toBe(false)
    })

    it('is case insensitive', () => {
      expect(shouldUseCloudinary('IMAGE/JPEG')).toBe(true)
      expect(shouldUseCloudinary('Image/PNG')).toBe(true)
    })
  })

  describe('shouldUseTelegram', () => {
    it('returns true for document types', () => {
      expect(shouldUseTelegram('application/pdf')).toBe(true)
      expect(shouldUseTelegram('application/zip')).toBe(true)
      expect(shouldUseTelegram('text/plain')).toBe(true)
    })

    it('returns false for image types', () => {
      expect(shouldUseTelegram('image/jpeg')).toBe(false)
      expect(shouldUseTelegram('image/png')).toBe(false)
    })
  })

  describe('MAX_FILE_SIZE', () => {
    it('has correct telegram limit', () => {
      expect(MAX_FILE_SIZE.telegram).toBe(1.5 * 1024 * 1024 * 1024) // 1.5GB
    })

    it('has correct cloudinary limit', () => {
      expect(MAX_FILE_SIZE.cloudinary).toBe(10 * 1024 * 1024) // 10MB
    })
  })
})

describe('Telegram Storage API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadToTelegram', () => {
    it('uploads file successfully', async () => {
      const mockResponse: TelegramFileResponse = {
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

    it('throws error when API key is not configured', async () => {
      process.env.TELEGRAM_STORAGE_API_KEY = ''

      await expect(
        uploadToTelegram(
          'project-123:/uploads/test.pdf',
          Buffer.from('test'),
          'application/pdf',
          'test.pdf'
        )
      ).rejects.toThrow('TELEGRAM_STORAGE_API_KEY environment variable is required')

      process.env.TELEGRAM_STORAGE_API_KEY = mockEnv.TELEGRAM_STORAGE_API_KEY
    })

    it('throws error on API failure', async () => {
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
      const mockResponse: TelegramFileResponse = {
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
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(getTelegramFileInfo('f_nonexistent')).rejects.toThrow('Failed to get file info')
    })
  })

  describe('deleteFromTelegram', () => {
    it('deletes file successfully', async () => {
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
      const mockFiles: TelegramFileResponse[] = [
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

describe('Cloudinary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadToCloudinary', () => {
    it('uploads image successfully', async () => {
      const mockResponse: CloudinaryUploadResponse = {
        public_id: 'test-image-123',
        version: 1234567890,
        signature: 'abc123',
        width: 800,
        height: 600,
        format: 'jpg',
        resource_type: 'image',
        created_at: new Date().toISOString(),
        tags: [],
        bytes: 10240,
        type: 'upload',
        etag: 'xyz123',
        placeholder: false,
        url: 'http://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-image-123.jpg',
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-image-123.jpg',
        access_mode: 'public',
        original_filename: 'photo.jpg',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await uploadToCloudinary(
        'project-123:/uploads/photo.jpg',
        Buffer.from('image data'),
        'image/jpeg',
        'photo.jpg'
      )

      expect(result.public_id).toBe('test-image-123')
      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
      expect(result.bytes).toBe(10240)
    })

    it('throws error when file size exceeds limit', async () => {
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE.cloudinary + 1)

      await expect(
        uploadToCloudinary(
          'project-123:/uploads/large.jpg',
          largeBuffer,
          'image/jpeg',
          'large.jpg'
        )
      ).rejects.toThrow('File size exceeds Cloudinary limit')
    })

    it('throws error when cloud name not configured', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = ''

      await expect(
        uploadToCloudinary(
          'project-123:/uploads/photo.jpg',
          Buffer.from('image'),
          'image/jpeg',
          'photo.jpg'
        )
      ).rejects.toThrow('CLOUDINARY_CLOUD_NAME environment variable is required')

      process.env.CLOUDINARY_CLOUD_NAME = mockEnv.CLOUDINARY_CLOUD_NAME
    })

    it('uploads video correctly', async () => {
      const mockResponse: CloudinaryUploadResponse = {
        public_id: 'video-123',
        resource_type: 'video',
        bytes: 512000,
        format: 'mp4',
        // ... other fields
        url: 'http://res.cloudinary.com/test-cloud/video/upload/v123/video-123.mp4',
        secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v123/video-123.mp4',
        original_filename: 'video.mp4',
        width: null,
        height: null,
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
        json: async () => mockResponse,
      })

      const result = await uploadToCloudinary(
        'project-123:/uploads/video.mp4',
        Buffer.from('video data'),
        'video/mp4',
        'video.mp4'
      )

      expect(result.public_id).toBe('video-123')
      expect(result.resource_type).toBe('video')
    })
  })

  describe('getCloudinaryUrl', () => {
    it('returns correct URL for image', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'

      const url = getCloudinaryUrl('public_id')
      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/public_id')
    })

    it('returns URL with transformations', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'

      const url = getCloudinaryUrl('public_id', 'w_500,h_500,c_fill')
      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_500,h_500,c_fill/public_id')
    })
  })
})

describe('Unified Storage Interface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('routes image to Cloudinary', async () => {
      const mockCloudinaryResponse: CloudinaryUploadResponse = {
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
      const mockTelegramResponse: TelegramFileResponse = {
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
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
      })

      const result = await fileExists('public_id', 'cloudinary')
      expect(result).toBe(true)
    })

    it('returns false when Cloudinary file not found', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
      })

      const result = await fileExists('nonexistent', 'cloudinary')
      expect(result).toBe(false)
    })

    it('returns true when Telegram file exists', async () => {
      const mockResponse: TelegramFileResponse = {
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
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
      })

      await expect(deleteFile('public_id', 'cloudinary')).resolves.not.toThrow()
    })

    it('deletes from Telegram', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
      })

      await expect(deleteFile('f_test123', 'telegram')).resolves.not.toThrow()
    })
  })
})
