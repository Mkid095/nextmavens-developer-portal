/**
 * Storage Metadata Module Tests
 *
 * Tests for database operations tracking uploaded files.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createStorageFile,
  getStorageFile,
  getStorageFileById,
  listStorageFiles,
  listStorageFilesByPath,
  listStorageFilesByBackend,
  updateStorageFileMetadata,
  deleteStorageFile,
  getStorageUsage,
  getStorageUsageByBackend,
  getStorageFileCount,
  getStorageStats,
  deleteProjectFiles,
  type StorageFile,
} from '../metadata'

// Mock database pool
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn(),
  })),
}))

describe('Storage Metadata Module', () => {
  const mockQuery = vi.fn()
  const mockPool = { query: mockQuery }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementation
    const { getPool } = require('@/lib/db')
    getPool.mockReturnValue(mockPool)
  })

  describe('createStorageFile', () => {
    it('creates new storage file record', async () => {
      const mockFile: StorageFile = {
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

      mockQuery.mockResolvedValueOnce({ rows: [mockFile] })

      const result = await createStorageFile(
        1,
        'project-123:/uploads/file.pdf',
        'file.pdf',
        1024,
        'application/pdf',
        'telegram',
        'f_test',
        'https://telegram-api.com/files/f_test'
      )

      expect(result).toEqual(mockFile)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.storage_files'),
        expect.arrayContaining([1, 'project-123:/uploads/file.pdf', 'file.pdf', 1024])
      )
    })

    it('updates existing record on conflict', async () => {
      const mockFile: StorageFile = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/file.pdf',
        file_name: 'file.pdf',
        file_size: 2048, // Updated size
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_test',
        file_url: 'https://telegram-api.com/files/f_test',
        uploaded_at: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockFile] })

      const result = await createStorageFile(
        1,
        'project-123:/uploads/file.pdf',
        'file.pdf',
        2048,
        'application/pdf',
        'telegram',
        'f_test',
        'https://telegram-api.com/files/f_test'
      )

      expect(result.file_size).toBe(2048)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (storage_path)'),
        expect.any(Array)
      )
    })

    it('stores etag and metadata', async () => {
      const mockFile: StorageFile = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/photo.jpg',
        file_name: 'photo.jpg',
        file_size: 1024,
        content_type: 'image/jpeg',
        backend: 'cloudinary',
        file_id: 'public_id',
        file_url: 'https://cloudinary.com/public_id.jpg',
        etag: 'abc123',
        metadata: { width: 800, height: 600 },
        uploaded_at: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockFile] })

      const result = await createStorageFile(
        1,
        'project-123:/uploads/photo.jpg',
        'photo.jpg',
        1024,
        'image/jpeg',
        'cloudinary',
        'public_id',
        'https://cloudinary.com/public_id.jpg',
        'abc123',
        { width: 800, height: 600 }
      )

      expect(result.etag).toBe('abc123')
      expect(result.metadata).toEqual({ width: 800, height: 600 })
    })
  })

  describe('getStorageFile', () => {
    it('retrieves file by storage path', async () => {
      const mockFile: StorageFile = {
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

      mockQuery.mockResolvedValueOnce({ rows: [mockFile] })

      const result = await getStorageFile('project-123:/uploads/file.pdf')

      expect(result).toEqual(mockFile)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE storage_path = $1'),
        ['project-123:/uploads/file.pdf']
      )
    })

    it('returns null when file not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await getStorageFile('project-123:/uploads/nonexistent.pdf')

      expect(result).toBeNull()
    })
  })

  describe('getStorageFileById', () => {
    it('retrieves file by ID', async () => {
      const mockFile: StorageFile = {
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

      mockQuery.mockResolvedValueOnce({ rows: [mockFile] })

      const result = await getStorageFileById('record-123')

      expect(result).toEqual(mockFile)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        ['record-123']
      )
    })

    it('returns null when file not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await getStorageFileById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('listStorageFiles', () => {
    it('lists files for a project', async () => {
      const mockFiles: StorageFile[] = [
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
          storage_path: 'project-123:/uploads/file2.pdf',
          file_name: 'file2.pdf',
          file_size: 2048,
          content_type: 'application/pdf',
          backend: 'telegram',
          file_id: 'f_2',
          file_url: 'https://telegram-api.com/files/f_2',
          uploaded_at: new Date(),
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockFiles })

      const result = await listStorageFiles(1, 100, 0)

      expect(result).toHaveLength(2)
      expect(result[0].file_name).toBe('file1.pdf')
      expect(result[1].file_name).toBe('file2.pdf')
    })

    it('applies limit and offset', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await listStorageFiles(1, 50, 10)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [1, 50, 10]
      )
    })
  })

  describe('listStorageFilesByPath', () => {
    it('lists files by path prefix', async () => {
      const mockFiles: StorageFile[] = [
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
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockFiles })

      const result = await listStorageFilesByPath(1, 'project-123:/uploads/photos', 100)

      expect(result).toHaveLength(1)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("storage_path LIKE $2"),
        [1, 'project-123:/uploads/photos%', 100]
      )
    })
  })

  describe('listStorageFilesByBackend', () => {
    it('lists files by backend type', async () => {
      const mockFiles: StorageFile[] = [
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
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockFiles })

      const result = await listStorageFilesByBackend(1, 'cloudinary', 100)

      expect(result).toHaveLength(1)
      expect(result[0].backend).toBe('cloudinary')
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('backend = $2'),
        [1, 'cloudinary', 100]
      )
    })
  })

  describe('updateStorageFileMetadata', () => {
    it('updates file metadata', async () => {
      const mockFile: StorageFile = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/file.pdf',
        file_name: 'file.pdf',
        file_size: 1024,
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_test',
        file_url: 'https://telegram-api.com/files/f_test',
        metadata: { updated: 'value' },
        uploaded_at: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockFile] })

      const result = await updateStorageFileMetadata('project-123:/uploads/file.pdf', {
        updated: 'value',
      })

      expect(result).toEqual(mockFile)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET metadata = $2'),
        ['project-123:/uploads/file.pdf', JSON.stringify({ updated: 'value' })]
      )
    })

    it('returns null when file not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await updateStorageFileMetadata(
        'project-123:/uploads/nonexistent.pdf',
        { test: 'value' }
      )

      expect(result).toBeNull()
    })
  })

  describe('deleteStorageFile', () => {
    it('deletes file record', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'record-123' }] })

      const result = await deleteStorageFile('project-123:/uploads/file.pdf')

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM control_plane.storage_files'),
        ['project-123:/uploads/file.pdf']
      )
    })

    it('returns false when file not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await deleteStorageFile('project-123:/uploads/nonexistent.pdf')

      expect(result).toBe(false)
    })
  })

  describe('getStorageUsage', () => {
    it('returns total storage usage for project', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: BigInt(10240000) }] })

      const result = await getStorageUsage(1)

      expect(result).toBe(10240000)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE(SUM(file_size), 0)'),
        [1]
      )
    })

    it('returns 0 when no files', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: BigInt(0) }] })

      const result = await getStorageUsage(1)

      expect(result).toBe(0)
    })
  })

  describe('getStorageUsageByBackend', () => {
    it('returns usage breakdown by backend', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { backend: 'telegram', total: BigInt(10240000) },
          { backend: 'cloudinary', total: BigInt(5120000) },
        ],
      })

      const result = await getStorageUsageByBackend(1)

      expect(result).toEqual({
        telegram: 10240000,
        cloudinary: 5120000,
        total: 15360000,
      })
    })

    it('returns zeros when no files', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await getStorageUsageByBackend(1)

      expect(result).toEqual({
        telegram: 0,
        cloudinary: 0,
        total: 0,
      })
    })
  })

  describe('getStorageFileCount', () => {
    it('returns file count for project', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: BigInt(42) }] })

      const result = await getStorageFileCount(1)

      expect(result).toBe(42)
    })
  })

  describe('getStorageStats', () => {
    it('returns comprehensive storage statistics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_bytes: BigInt(10240000),
            file_count: BigInt(10),
            largest_file_name: 'large-file.pdf',
            largest_file_size: BigInt(5120000),
            largest_file_backend: 'telegram',
            average_file_size: BigInt(1024000),
            telegram_bytes: BigInt(7680000),
            telegram_count: BigInt(7),
            cloudinary_bytes: BigInt(2560000),
            cloudinary_count: BigInt(3),
          },
        ],
      })

      const result = await getStorageStats(1)

      expect(result).toEqual({
        totalBytes: 10240000,
        fileCount: 10,
        largestFile: {
          name: 'large-file.pdf',
          size: 5120000,
          backend: 'telegram',
        },
        averageFileSize: 1024000,
        backendBreakdown: {
          telegram: { bytes: 7680000, count: 7 },
          cloudinary: { bytes: 2560000, count: 3 },
        },
      })
    })

    it('handles empty project', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_bytes: BigInt(0),
            file_count: BigInt(0),
            largest_file_name: null,
            largest_file_size: null,
            largest_file_backend: null,
            average_file_size: BigInt(0),
            telegram_bytes: BigInt(0),
            telegram_count: BigInt(0),
            cloudinary_bytes: BigInt(0),
            cloudinary_count: BigInt(0),
          },
        ],
      })

      const result = await getStorageStats(1)

      expect(result.totalBytes).toBe(0)
      expect(result.fileCount).toBe(0)
      expect(result.largestFile).toBeNull()
    })
  })

  describe('deleteProjectFiles', () => {
    it('deletes all files for a project', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: BigInt(15) }] })

      const result = await deleteProjectFiles(1)

      expect(result).toBe(15)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM control_plane.storage_files'),
        [1]
      )
    })

    it('returns 0 when no files deleted', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: BigInt(0) }] })

      const result = await deleteProjectFiles(1)

      expect(result).toBe(0)
    })
  })
})
