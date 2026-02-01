/**
 * Storage Upload Module Tests
 *
 * Tests for upload functions with routing logic and file validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { uploadFileWithTracking, getMaxFileSize, getMaxFileSizeForBackend, validateFileName, sanitizeFileName, getFileExtension, getContentTypeFromExtension, isImageContentType, isVideoContentType, isAudioContentType } from '../upload'
import { MAX_FILE_SIZE, shouldUseCloudinary, type StorageBackend } from '../client'
import { createStorageFile, getStorageUsage } from '../metadata'

// Mock dependencies
vi.mock('../client', () => ({
  uploadFile: vi.fn(),
  shouldUseCloudinary: vi.fn(),
  MAX_FILE_SIZE: {
    telegram: 1.5 * 1024 * 1024 * 1024,
    cloudinary: 10 * 1024 * 1024,
  },
}))

vi.mock('../metadata', () => ({
  createStorageFile: vi.fn(),
  getStorageUsage: vi.fn().mockResolvedValue(0),
}))

describe('Storage Upload Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadFileWithTracking', () => {
    const { uploadFile: mockUploadFile, createStorageFile: mockCreateStorageFile, getStorageUsage: mockGetStorageUsage } = require('../client')
    const { shouldUseCloudinary: mockShouldUseCloudinary } = require('../client')
    const { createStorageFile: mockCreateFile, getStorageUsage: mockGetUsage } = require('../metadata')

    beforeEach(() => {
      vi.clearAllMocks()
      mockGetStorageUsage.mockResolvedValue(5000000) // 5MB used
    })

    it('uploads image to Cloudinary when content type is image', async () => {
      mockShouldUseCloudinary.mockReturnValue(true)
      mockUploadFile.mockResolvedValue({
        backend: 'cloudinary',
        id: 'cloud-123',
        url: 'https://cloudinary.com/file.jpg',
        name: 'photo.jpg',
        size: 1024,
        contentType: 'image/jpeg',
        metadata: { width: 800, height: 600 },
      })
      mockCreateFile.mockResolvedValue({
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/photo.jpg',
        file_name: 'photo.jpg',
        file_size: 1024,
        content_type: 'image/jpeg',
        backend: 'cloudinary',
        file_id: 'cloud-123',
        file_url: 'https://cloudinary.com/file.jpg',
        uploaded_at: new Date(),
      })

      const result = await uploadFileWithTracking(
        1,
        'project-123:/uploads/photo.jpg',
        'photo.jpg',
        Buffer.from('image data'),
        { contentType: 'image/jpeg' }
      )

      expect(mockShouldUseCloudinary).toHaveBeenCalledWith('image/jpeg')
      expect(mockUploadFile).toHaveBeenCalledWith(
        'project-123:/uploads/photo.jpg',
        expect.any(Buffer),
        'image/jpeg',
        'photo.jpg'
      )
      expect(mockCreateFile).toHaveBeenCalledWith(
        1,
        'project-123:/uploads/photo.jpg',
        'photo.jpg',
        1024,
        'image/jpeg',
        'cloudinary',
        'cloud-123',
        'https://cloudinary.com/file.jpg',
        undefined,
        expect.any(Object)
      )
      expect(result.backend).toBe('cloudinary')
    })

    it('uploads document to Telegram when content type is pdf', async () => {
      mockShouldUseCloudinary.mockReturnValue(false)
      mockUploadFile.mockResolvedValue({
        backend: 'telegram',
        id: 'f_abc123',
        url: 'https://telegram-api.com/files/f_abc123',
        downloadUrl: 'https://telegram-api.com/files/f_abc123/download',
        name: 'document.pdf',
        size: 2048,
        contentType: 'application/pdf',
        metadata: { folder: '/uploads' },
      })
      mockCreateFile.mockResolvedValue({
        id: 'record-456',
        project_id: 1,
        storage_path: 'project-123:/uploads/document.pdf',
        file_name: 'document.pdf',
        file_size: 2048,
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_abc123',
        file_url: 'https://telegram-api.com/files/f_abc123',
        uploaded_at: new Date(),
      })

      const result = await uploadFileWithTracking(
        1,
        'project-123:/uploads/document.pdf',
        'document.pdf',
        Buffer.from('pdf content'),
        { contentType: 'application/pdf' }
      )

      expect(mockShouldUseCloudinary).toHaveBeenCalledWith('application/pdf')
      expect(result.backend).toBe('telegram')
      expect(result.id).toBe('f_abc123')
    })

    it('throws validation error when file size exceeds backend limit', async () => {
      mockShouldUseCloudinary.mockReturnValue(false)

      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE.telegram + 1)

      await expect(
        uploadFileWithTracking(
          1,
          'project-123:/uploads/large.pdf',
          'large.pdf',
          largeBuffer,
          { contentType: 'application/pdf' }
        )
      ).rejects.toThrow(/File size exceeds telegram limit/)
    })

    it('includes total storage usage in result', async () => {
      mockShouldUseCloudinary.mockReturnValue(false)
      mockUploadFile.mockResolvedValue({
        backend: 'telegram',
        id: 'f_test',
        url: 'https://test.com/file',
        downloadUrl: 'https://test.com/file/download',
        name: 'file.pdf',
        size: 1024,
        contentType: 'application/pdf',
      })
      mockCreateFile.mockResolvedValue({
        id: 'record-123',
        uploaded_at: new Date(),
      })
      mockGetStorageUsage.mockResolvedValue(10240)

      const result = await uploadFileWithTracking(
        1,
        'project-123:/uploads/file.pdf',
        'file.pdf',
        Buffer.from('content'),
        { contentType: 'application/pdf' }
      )

      expect(result.totalUsage).toBe(10240)
      expect(mockGetStorageUsage).toHaveBeenCalledWith(1)
    })
  })

  describe('getMaxFileSize', () => {
    it('returns cloudinary limit for images', () => {
      const { shouldUseCloudinary: mockShouldUse } = require('../client')
      mockShouldUseCloudinary.mockReturnValue(true)

      const size = getMaxFileSize('image/jpeg')
      expect(size).toBe(MAX_FILE_SIZE.cloudinary)
    })

    it('returns telegram limit for documents', () => {
      const { shouldUseCloudinary: mockShouldUse } = require('../client')
      mockShouldUseCloudinary.mockReturnValue(false)

      const size = getMaxFileSize('application/pdf')
      expect(size).toBe(MAX_FILE_SIZE.telegram)
    })
  })

  describe('getMaxFileSizeForBackend', () => {
    it('returns correct size for telegram', () => {
      expect(getMaxFileSizeForBackend('telegram')).toBe(MAX_FILE_SIZE.telegram)
    })

    it('returns correct size for cloudinary', () => {
      expect(getMaxFileSizeForBackend('cloudinary')).toBe(MAX_FILE_SIZE.cloudinary)
    })
  })

  describe('validateFileName', () => {
    it('returns true for valid file names', () => {
      expect(validateFileName('document.pdf')).toBe(true)
      expect(validateFileName('image-123.jpg')).toBe(true)
      expect(validateFileName('my_file.txt')).toBe(true)
      expect(validateFileName('archive.tar.gz')).toBe(true)
    })

    it('returns false for file names with invalid characters', () => {
      expect(validateFileName('file/name')).toBe(false)
      expect(validateFileName('file:name')).toBe(false)
      expect(validateFileName('file*.txt')).toBe(false)
      expect(validateFileName('file?.txt')).toBe(false)
    })

    it('returns false for reserved Windows names', () => {
      expect(validateFileName('CON')).toBe(false)
      expect(validateFileName('PRN')).toBe(false)
      expect(validateFileName('AUX')).toBe(false)
      expect(validateFileName('NUL')).toBe(false)
      expect(validateFileName('COM1')).toBe(false)
      expect(validateFileName('LPT1')).toBe(false)
    })

    it('returns false for too long file names', () => {
      const longName = 'a'.repeat(256)
      expect(validateFileName(longName)).toBe(false)
    })

    it('returns false for empty or non-string input', () => {
      expect(validateFileName('')).toBe(false)
      expect(validateFileName(null as any)).toBe(false)
      expect(validateFileName(undefined as any)).toBe(false)
    })
  })

  describe('sanitizeFileName', () => {
    it('removes invalid characters', () => {
      expect(sanitizeFileName('file/name')).toBe('file_name')
      expect(sanitizeFileName('file:name')).toBe('file_name')
      expect(sanitizeFileName('file*.txt')).toBe('file_txt')
      expect(sanitizeFileName('file?.txt')).toBe('file_txt')
      expect(sanitizeFileName('file<>txt')).toBe('file_txt')
    })

    it('truncates to 255 characters', () => {
      const longName = 'a'.repeat(300)
      const sanitized = sanitizeFileName(longName)
      expect(sanitized.length).toBeLessThanOrEqual(255)
    })

    it('preserves valid file names', () => {
      expect(sanitizeFileName('document.pdf')).toBe('document.pdf')
      expect(sanitizeFileName('my-file.txt')).toBe('my-file.txt')
    })
  })

  describe('getFileExtension', () => {
    it('extracts file extension', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('image.jpg')).toBe('jpg')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
      expect(getFileExtension('noextension')).toBe('')
    })
  })

  describe('getContentTypeFromExtension', () => {
    it('returns MIME type for common extensions', () => {
      expect(getContentTypeFromExtension('jpg')).toBe('image/jpeg')
      expect(getContentTypeFromExtension('png')).toBe('image/png')
      expect(getContentTypeFromExtension('pdf')).toBe('application/pdf')
      expect(getContentTypeFromExtension('txt')).toBe('text/plain')
      expect(getContentTypeFromExtension('json')).toBe('application/json')
    })

    it('handles dot prefix', () => {
      expect(getContentTypeFromExtension('.jpg')).toBe('image/jpeg')
      expect(getContentTypeFromExtension('.pdf')).toBe('application/pdf')
    })

    it('returns undefined for unknown extension', () => {
      expect(getContentTypeFromExtension('xyz')).toBeUndefined()
      expect(getContentTypeFromExtension('')).toBeUndefined()
    })
  })

  describe('isImageContentType', () => {
    it('returns true for image types', () => {
      expect(isImageContentType('image/jpeg')).toBe(true)
      expect(isImageContentType('image/png')).toBe(true)
      expect(isImageContentType('image/webp')).toBe(true)
    })

    it('returns false for non-image types', () => {
      expect(isImageContentType('application/pdf')).toBe(false)
      expect(isImageContentType('video/mp4')).toBe(false)
      expect(isImageContentType('text/plain')).toBe(false)
    })
  })

  describe('isVideoContentType', () => {
    it('returns true for video types', () => {
      expect(isVideoContentType('video/mp4')).toBe(true)
      expect(isVideoContentType('video/webm')).toBe(true)
      expect(isVideoContentType('video/mov')).toBe(true)
    })

    it('returns false for non-video types', () => {
      expect(isVideoContentType('image/jpeg')).toBe(false)
      expect(isVideoContentType('application/pdf')).toBe(false)
      expect(isVideoContentType('audio/mp3')).toBe(false)
    })
  })

  describe('isAudioContentType', () => {
    it('returns true for audio types', () => {
      expect(isAudioContentType('audio/mp3')).toBe(true)
      expect(isAudioContentType('audio/wav')).toBe(true)
      expect(isAudioContentType('audio/ogg')).toBe(true)
    })

    it('returns false for non-audio types', () => {
      expect(isAudioContentType('image/jpeg')).toBe(false)
      expect(isAudioContentType('video/mp4')).toBe(false)
      expect(isAudioContentType('application/pdf')).toBe(false)
    })
  })
})
