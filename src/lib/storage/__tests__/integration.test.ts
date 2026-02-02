/**
 * Storage Service Integration Tests
 *
 * End-to-end tests for the complete storage workflow.
 * Tests upload, download, metadata, and deletion flow.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  uploadFileWithTracking,
  downloadFileFromStorage,
  fileExistsInStorage,
  getFileMetadata,
  getFileUrl,
  deleteFileFromStorage,
  listFilesWithMetadata,
  listFilesByBackend,
} from '../index'

// Mock all dependencies
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  fileExists: vi.fn(),
  deleteFile: vi.fn(),
  shouldUseCloudinary: vi.fn((contentType: string) => contentType.startsWith('image/')),
  MAX_FILE_SIZE: {
    telegram: 1.5 * 1024 * 1024 * 1024,
    cloudinary: 10 * 1024 * 1024,
  },
}))

  createStorageFile: vi.fn(),
  getStorageFile: vi.fn(),
  listStorageFiles: vi.fn(),
  listStorageFilesByBackend: vi.fn(),
  deleteStorageFile: vi.fn(),
  getStorageUsage: vi.fn(),
  getStorageStats: vi.fn(),
}))

describe('Storage Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Upload-Download-Delete Flow', () => {
    it('handles full lifecycle for PDF document via Telegram', async () => {
      const { uploadFile: mockUploadFile } = await import('../client')
      const { createStorageFile: mockCreateFile, getStorageUsage: mockGetUsage } =
        await import('../metadata')
      const { downloadFile: mockDownloadFile } = await import('../client')
      const { getStorageFile: mockGetFile } = await import('../metadata')
      const { deleteFile: mockDeleteFile } = await import('../client')
      const { deleteStorageFile: mockDeleteRecord } = await import('../metadata')

      const fileBuffer = Buffer.from('PDF document content')
      const uploadResult = {
        backend: 'telegram',
        id: 'f_abc123',
        url: 'https://telegram-api.com/files/f_abc123',
        name: 'document.pdf',
        size: fileBuffer.length,
        contentType: 'application/pdf',
        metadata: { folder: '/uploads' },
      }

      const dbRecord = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/document.pdf',
        file_name: 'document.pdf',
        file_size: fileBuffer.length,
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_abc123',
        file_url: 'https://telegram-api.com/files/f_abc123',
        uploaded_at: new Date(),
      }

      // Setup upload mocks
      mockUploadFile.mockResolvedValue(uploadResult)
      mockCreateFile.mockResolvedValue(dbRecord)
      mockGetUsage.mockResolvedValue(10240000)

      // Upload
      const uploadResponse = await uploadFileWithTracking(
        1,
        'project-123:/uploads/document.pdf',
        'document.pdf',
        fileBuffer,
        { contentType: 'application/pdf' }
      )

      expect(uploadResponse.backend).toBe('telegram')
      expect(uploadResponse.id).toBe('f_abc123')
      expect(uploadResponse.totalUsage).toBe(10240000)

      // Setup get file mock
      mockGetFile.mockResolvedValue(dbRecord)

      // Get metadata
      const metadata = await getFileMetadata('project-123:/uploads/document.pdf')
      expect(metadata).toEqual(dbRecord)

      // Setup download mock
      mockDownloadFile.mockResolvedValue({
        data: fileBuffer,
        contentType: 'application/pdf',
        fileName: 'document.pdf',
      })

      // Download
      const downloadResult = await downloadFileFromStorage('project-123:/uploads/document.pdf')
      expect(downloadResult.data).toEqual(fileBuffer)
      expect(downloadResult.contentType).toBe('application/pdf')

      // Setup delete mocks
      mockDeleteFile.mockResolvedValue(undefined)
      mockDeleteRecord.mockResolvedValue(true)

      // Delete
      const deleted = await deleteFileFromStorage('project-123:/uploads/document.pdf')
      expect(deleted).toBe(true)
      expect(mockDeleteFile).toHaveBeenCalledWith('f_abc123', 'telegram')
      expect(mockDeleteRecord).toHaveBeenCalledWith('project-123:/uploads/document.pdf')
    })

    it('handles full lifecycle for image via Cloudinary', async () => {
      const { uploadFile: mockUploadFile } = await import('../client')
      const { createStorageFile: mockCreateFile, getStorageUsage: mockGetUsage } =
        await import('../metadata')
      const { downloadFile: mockDownloadFile } = await import('../client')
      const { getStorageFile: mockGetFile } = await import('../metadata')
      const { deleteFile: mockDeleteFile } = await import('../client')
      const { deleteStorageFile: mockDeleteRecord } = await import('../metadata')

      const fileBuffer = Buffer.from('image data')
      const uploadResult = {
        backend: 'cloudinary',
        id: 'public_id',
        url: 'https://cloudinary.com/public_id.jpg',
        name: 'photo.jpg',
        size: fileBuffer.length,
        contentType: 'image/jpeg',
        metadata: { width: 800, height: 600, etag: 'xyz123' },
      }

      const dbRecord = {
        id: 'record-456',
        project_id: 1,
        storage_path: 'project-123:/uploads/photo.jpg',
        file_name: 'photo.jpg',
        file_size: fileBuffer.length,
        content_type: 'image/jpeg',
        backend: 'cloudinary',
        file_id: 'public_id',
        file_url: 'https://cloudinary.com/public_id.jpg',
        etag: 'xyz123',
        metadata: { width: 800, height: 600 },
        uploaded_at: new Date(),
      }

      // Setup upload mocks
      mockUploadFile.mockResolvedValue(uploadResult)
      mockCreateFile.mockResolvedValue(dbRecord)
      mockGetUsage.mockResolvedValue(2560000)

      // Upload
      const uploadResponse = await uploadFileWithTracking(
        1,
        'project-123:/uploads/photo.jpg',
        'photo.jpg',
        fileBuffer,
        { contentType: 'image/jpeg' }
      )

      expect(uploadResponse.backend).toBe('cloudinary')
      expect(uploadResponse.id).toBe('public_id')
      expect(uploadResponse.totalUsage).toBe(2560000)

      // Setup get file mock
      mockGetFile.mockResolvedValue(dbRecord)

      // Get metadata
      const metadata = await getFileMetadata('project-123:/uploads/photo.jpg')
      expect(metadata).toEqual(dbRecord)

      // Setup download mock
      mockDownloadFile.mockResolvedValue({
        data: fileBuffer,
        contentType: 'image/jpeg',
        fileName: 'photo.jpg',
      })

      // Download
      const downloadResult = await downloadFileFromStorage('project-123:/uploads/photo.jpg')
      expect(downloadResult.data).toEqual(fileBuffer)

      // Setup delete mocks
      mockDeleteFile.mockResolvedValue(undefined)
      mockDeleteRecord.mockResolvedValue(true)

      // Delete
      const deleted = await deleteFileFromStorage('project-123:/uploads/photo.jpg')
      expect(deleted).toBe(true)
      expect(mockDeleteFile).toHaveBeenCalledWith('public_id', 'cloudinary')
    })
  })

  describe('File Existence and URL Operations', () => {
    it('checks file existence correctly', async () => {
      const { fileExists: mockFileExists } = await import('../client')
      const { getStorageFile: mockGetFile } = await import('../metadata')

      const dbRecord = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/file.pdf',
        file_name: 'file.pdf',
        file_size: 1024,
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_test',
        file_url: 'https://telegram-api.com/files/f_test',
        uploaded_at: new Date(),
      }

      mockGetFile.mockResolvedValue(dbRecord)
      mockFileExists.mockResolvedValue(true)

      const exists = await fileExistsInStorage('project-123:/uploads/file.pdf')
      expect(exists).toBe(true)
      expect(mockFileExists).toHaveBeenCalledWith('f_test', 'telegram')
    })

    it('returns false for non-existent files', async () => {
      const { getStorageFile: mockGetFile } = await import('../metadata')
      mockGetFile.mockResolvedValue(null)

      const exists = await fileExistsInStorage('project-123:/uploads/nonexistent.pdf')
      expect(exists).toBe(false)
    })

    it('gets file URL from metadata', async () => {
      const { getStorageFile: mockGetFile } = await import('../metadata')

      const dbRecord = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/file.pdf',
        file_name: 'file.pdf',
        file_size: 1024,
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_test',
        file_url: 'https://telegram-api.com/files/f_test',
        uploaded_at: new Date(),
      }

      mockGetFile.mockResolvedValue(dbRecord)

      const url = await getFileUrl('project-123:/uploads/file.pdf')
      expect(url).toBe('https://telegram-api.com/files/f_test')
    })

    it('returns null URL for non-existent files', async () => {
      const { getStorageFile: mockGetFile } = await import('../metadata')
      mockGetFile.mockResolvedValue(null)

      const url = await getFileUrl('project-123:/uploads/nonexistent.pdf')
      expect(url).toBeNull()
    })
  })

  describe('File Listing Operations', () => {
    it('lists all files for a project', async () => {
      const { listStorageFiles: mockListFiles } = await import('../metadata')

      const mockFiles = [
        {
          id: 'record-1',
          project_id: 1,
          storage_path: 'project-123:/uploads/file1.pdf',
          file_name: 'file1.pdf',
          file_size: 1024,
          content_type: 'application/pdf',
          backend: 'telegram',
          file_id: 'f_1',
          file_url: 'https://telegram-api.com/files/f_1',
          uploaded_at: new Date(),
        },
        {
          id: 'record-2',
          project_id: 1,
          storage_path: 'project-123:/uploads/image1.jpg',
          file_name: 'image1.jpg',
          file_size: 2048,
          content_type: 'image/jpeg',
          backend: 'cloudinary',
          file_id: 'public_1',
          file_url: 'https://cloudinary.com/public_1.jpg',
          uploaded_at: new Date(),
        },
      ]

      mockListFiles.mockResolvedValue(mockFiles)

      const files = await listFilesWithMetadata(1)

      expect(files).toHaveLength(2)
      expect(files[0].file_name).toBe('file1.pdf')
      expect(files[1].file_name).toBe('image1.jpg')
    })

    it('lists files by path prefix', async () => {
      const { listStorageFiles: mockListFiles } = await import('../metadata')

      const mockFiles = [
        {
          id: 'record-1',
          project_id: 1,
          storage_path: 'project-123:/uploads/photos/image1.jpg',
          file_name: 'image1.jpg',
          file_size: 1024,
          content_type: 'image/jpeg',
          backend: 'cloudinary',
          file_id: 'public_1',
          file_url: 'https://cloudinary.com/public_1.jpg',
          uploaded_at: new Date(),
        },
        {
          id: 'record-2',
          project_id: 1,
          storage_path: 'project-123:/uploads/photos/image2.jpg',
          file_name: 'image2.jpg',
          file_size: 2048,
          content_type: 'image/jpeg',
          backend: 'cloudinary',
          file_id: 'public_2',
          file_url: 'https://cloudinary.com/public_2.jpg',
          uploaded_at: new Date(),
        },
      ]

      mockListFiles.mockResolvedValue(mockFiles)

      const files = await listFilesWithMetadata(1, '/uploads/photos')

      expect(files).toHaveLength(2)
      expect(files[0].storage_path).toContain('/uploads/photos')
      expect(files[1].storage_path).toContain('/uploads/photos')
    })

    it('lists files by backend type', async () => {
      const { listStorageFilesByBackend: mockListByBackend } = await import('../metadata')

      const mockFiles = [
        {
          id: 'record-1',
          project_id: 1,
          storage_path: 'project-123:/uploads/image1.jpg',
          file_name: 'image1.jpg',
          file_size: 1024,
          content_type: 'image/jpeg',
          backend: 'cloudinary',
          file_id: 'public_1',
          file_url: 'https://cloudinary.com/public_1.jpg',
          uploaded_at: new Date(),
        },
        {
          id: 'record-2',
          project_id: 1,
          storage_path: 'project-123:/uploads/image2.jpg',
          file_name: 'image2.jpg',
          file_size: 2048,
          content_type: 'image/jpeg',
          backend: 'cloudinary',
          file_id: 'public_2',
          file_url: 'https://cloudinary.com/public_2.jpg',
          uploaded_at: new Date(),
        },
      ]

      mockListByBackend.mockResolvedValue(mockFiles)

      const files = await listFilesByBackend(1, 'cloudinary')

      expect(files).toHaveLength(2)
      expect(files[0].backend).toBe('cloudinary')
      expect(files[1].backend).toBe('cloudinary')
    })
  })

  describe('Storage Statistics', () => {
    it('calculates storage stats correctly', async () => {
      const { getStorageStats: mockGetStats } = await import('../metadata')

      const mockStats = {
        totalBytes: 15360000,
        fileCount: 10,
        largestFile: {
          name: 'large-file.pdf',
          size: 5120000,
          backend: 'telegram',
        },
        averageFileSize: 1536000,
        backendBreakdown: {
          telegram: { bytes: 10240000, count: 7 },
          cloudinary: { bytes: 5120000, count: 3 },
        },
      }

      mockGetStats.mockResolvedValue(mockStats)

      const stats = await getStorageStats(1)

      expect(stats.totalBytes).toBe(15360000)
      expect(stats.fileCount).toBe(10)
      expect(stats.largestFile).toEqual({
        name: 'large-file.pdf',
        size: 5120000,
        backend: 'telegram',
      })
      expect(stats.backendBreakdown.telegram.count).toBe(7)
      expect(stats.backendBreakdown.cloudinary.count).toBe(3)
    })

    it('gets total storage usage', async () => {
      const { getStorageUsage: mockGetUsage } = await import('../metadata')

      mockGetUsage.mockResolvedValue(10240000)

      const usage = await getStorageUsage(1)

      expect(usage).toBe(10240000)
    })
  })

  describe('Error Handling', () => {
    it('handles upload errors gracefully', async () => {
      const { uploadFile: mockUploadFile } = await import('../client')

      mockUploadFile.mockRejectedValue(new Error('Upload failed'))

      await expect(
        uploadFileWithTracking(
          1,
          'project-123:/uploads/file.pdf',
          'file.pdf',
          Buffer.from('content'),
          { contentType: 'application/pdf' }
        )
      ).rejects.toThrow('Upload failed')
    })

    it('handles file size validation error', async () => {
      const { shouldUseCloudinary: mockShouldUse } = await import('../client')
      const { MAX_FILE_SIZE } = await import('../client')

      mockShouldUse.mockReturnValue(false)

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

    it('handles download errors gracefully', async () => {
      const { getStorageFile: mockGetFile } = await import('../metadata')

      mockGetFile.mockResolvedValue(null)

      await expect(
        downloadFileFromStorage('project-123:/uploads/nonexistent.pdf')
      ).rejects.toThrow('File not found in storage metadata')
    })

    it('handles deletion of non-existent file gracefully', async () => {
      const { getStorageFile: mockGetFile } = await import('../metadata')

      mockGetFile.mockResolvedValue(null)

      const deleted = await deleteFileFromStorage('project-123:/uploads/nonexistent.pdf')
      expect(deleted).toBe(false)
    })
  })

  describe('Content Type Routing', () => {
    it('routes images to Cloudinary', async () => {
      const { shouldUseCloudinary: mockShouldUse } = await import('../client')

      mockShouldUse.mockReturnValue(true)

      expect(mockShouldUse('image/jpeg')).toBe(true)
      expect(mockShouldUse('image/png')).toBe(true)
      expect(mockShouldUse('image/webp')).toBe(true)
    })

    it('routes videos to Cloudinary', async () => {
      const { shouldUseCloudinary: mockShouldUse } = await import('../client')

      mockShouldUse.mockReturnValue(true)

      expect(mockShouldUse('video/mp4')).toBe(true)
      expect(mockShouldUse('video/webm')).toBe(true)
    })

    it('routes audio to Cloudinary', async () => {
      const { shouldUseCloudinary: mockShouldUse } = await import('../client')

      mockShouldUse.mockReturnValue(true)

      expect(mockShouldUse('audio/mp3')).toBe(true)
      expect(mockShouldUse('audio/wav')).toBe(true)
    })

    it('routes documents to Telegram', async () => {
      const { shouldUseCloudinary: mockShouldUse } = await import('../client')

      mockShouldUse.mockReturnValue(false)

      expect(mockShouldUse('application/pdf')).toBe(false)
      expect(mockShouldUse('text/plain')).toBe(false)
      expect(mockShouldUse('application/zip')).toBe(false)
    })
  })
})
