/**
 * Cloudinary Tests
 * Tests for Cloudinary storage backend
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn() as any

// Helper to get fresh module import
async function importClientModule() {
  vi.resetModules()
  return await import('../client')
}

describe('Cloudinary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud')
    vi.stubEnv('CLOUDINARY_UPLOAD_PRESET', 'test-preset')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('uploadToCloudinary', () => {
    it('uploads image successfully', async () => {
      const { uploadToCloudinary } = await importClientModule()

      const mockResponse = {
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
      const { uploadToCloudinary, MAX_FILE_SIZE } = await importClientModule()
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

    it('uploads video correctly', async () => {
      const { uploadToCloudinary } = await importClientModule()

      const mockResponse = {
        public_id: 'video-123',
        resource_type: 'video',
        bytes: 512000,
        format: 'mp4',
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
    it('returns correct URL for image', async () => {
      const { getCloudinaryUrl } = await importClientModule()

      const url = getCloudinaryUrl('public_id')
      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/public_id')
    })

    it('returns URL with transformations', async () => {
      const { getCloudinaryUrl } = await importClientModule()

      const url = getCloudinaryUrl('public_id', 'w_500,h_500,c_fill')
      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_500,h_500,c_fill/public_id')
    })
  })
})
