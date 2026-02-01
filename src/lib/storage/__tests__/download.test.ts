/**
 * Storage Download Module Tests
 *
 * Tests for download functions and file URL generation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  downloadFileFromStorage,
  fileExistsInStorage,
  getFileMetadata,
  getFileInfo,
  getFileUrl,
  getFilesInfo,
} from '../download'

// Mock dependencies
vi.mock('../client', () => ({
  downloadFile: vi.fn(),
  fileExists: vi.fn(),
}))

vi.mock('../metadata', () => ({
  getStorageFile: vi.fn(),
}))

describe('Storage Download Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('downloadFileFromStorage', () => {
    it('downloads file from storage backend', async () => {
      const { downloadFile: mockDownloadFile } = await import('../client')
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      const mockFile = {
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

      mockGetStorageFile.mockResolvedValue(mockFile)
      mockDownloadFile.mockResolvedValue({
        data: Buffer.from('file content'),
        contentType: 'application/pdf',
        fileName: 'file.pdf',
      })

      const result = await downloadFileFromStorage('project-123:/uploads/file.pdf')

      expect(result.data).toEqual(Buffer.from('file content'))
      expect(result.contentType).toBe('application/pdf')
      expect(result.fileName).toBe('file.pdf')
      expect(result.backend).toBe('telegram')
      expect(mockDownloadFile).toHaveBeenCalledWith('f_test', 'telegram')
    })

    it('throws error when file record not found', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')
      mockGetStorageFile.mockResolvedValue(null)

      await expect(
        downloadFileFromStorage('project-123:/uploads/nonexistent.pdf')
      ).rejects.toThrow('File not found in storage metadata')
    })

    it('includes file metadata in result', async () => {
      const { downloadFile: mockDownloadFile } = await import('../client')
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      const mockFile = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/file.pdf',
        file_name: 'file.pdf',
        file_size: 1024,
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_test',
        file_url: 'https://telegram-api.com/files/f_test',
        metadata: { custom: 'value' },
        uploaded_at: new Date(),
      }

      mockGetStorageFile.mockResolvedValue(mockFile)
      mockDownloadFile.mockResolvedValue({
        data: Buffer.from('content'),
        contentType: 'application/pdf',
        fileName: 'file.pdf',
      })

      const result = await downloadFileFromStorage('project-123:/uploads/file.pdf')

      expect(result.storagePath).toBe('project-123:/uploads/file.pdf')
      expect(result.fileSize).toBe(Buffer.from('content').length)
    })
  })

  describe('fileExistsInStorage', () => {
    it('returns true when file exists in backend', async () => {
      const { fileExists: mockFileExists } = await import('../client')
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      mockGetStorageFile.mockResolvedValue({
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
      })

      mockFileExists.mockResolvedValue(true)

      const result = await fileExistsInStorage('project-123:/uploads/file.pdf')

      expect(result).toBe(true)
      expect(mockFileExists).toHaveBeenCalledWith('f_test', 'telegram')
    })

    it('returns false when file record not found', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')
      mockGetStorageFile.mockResolvedValue(null)

      const result = await fileExistsInStorage('project-123:/uploads/nonexistent.pdf')

      expect(result).toBe(false)
    })

    it('returns false when file not in backend', async () => {
      const { fileExists: mockFileExists } = await import('../client')
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      mockGetStorageFile.mockResolvedValue({
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
      })

      mockFileExists.mockResolvedValue(false)

      const result = await fileExistsInStorage('project-123:/uploads/file.pdf')

      expect(result).toBe(false)
    })
  })

  describe('getFileMetadata', () => {
    it('returns file metadata from database', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      const mockFile = {
        id: 'record-123',
        project_id: 1,
        storage_path: 'project-123:/uploads/file.pdf',
        file_name: 'file.pdf',
        file_size: 1024,
        content_type: 'application/pdf',
        backend: 'telegram',
        file_id: 'f_test',
        file_url: 'https://telegram-api.com/files/f_test',
        uploaded_at: new Date('2024-01-01T00:00:00Z'),
        metadata: { custom: 'value' },
      }

      mockGetStorageFile.mockResolvedValue(mockFile)

      const result = await getFileMetadata('project-123:/uploads/file.pdf')

      expect(result).toEqual(mockFile)
      expect(mockGetStorageFile).toHaveBeenCalledWith('project-123:/uploads/file.pdf')
    })

    it('returns null when file not found', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')
      mockGetStorageFile.mockResolvedValue(null)

      const result = await getFileMetadata('project-123:/uploads/nonexistent.pdf')

      expect(result).toBeNull()
    })
  })

  describe('getFileInfo', () => {
    it('returns file info from database', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      const mockFile = {
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

      mockGetStorageFile.mockResolvedValue(mockFile)

      const result = await getFileInfo('project-123:/uploads/file.pdf')

      expect(result).toEqual(mockFile)
    })

    it('returns null when file not found', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')
      mockGetStorageFile.mockResolvedValue(null)

      const result = await getFileInfo('project-123:/uploads/nonexistent.pdf')

      expect(result).toBeNull()
    })
  })

  describe('getFileUrl', () => {
    it('returns file URL from database', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      mockGetStorageFile.mockResolvedValue({
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
      })

      const result = await getFileUrl('project-123:/uploads/file.pdf')

      expect(result).toBe('https://telegram-api.com/files/f_test')
    })

    it('returns null when file not found', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')
      mockGetStorageFile.mockResolvedValue(null)

      const result = await getFileUrl('project-123:/uploads/nonexistent.pdf')

      expect(result).toBeNull()
    })
  })

  describe('getFilesInfo', () => {
    it('returns info for multiple files by storage paths array', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      mockGetStorageFile.mockImplementation((storagePath) => {
        if (storagePath === 'project-123:/uploads/file1.pdf') {
          return Promise.resolve({
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
          })
        }
        if (storagePath === 'project-123:/uploads/file2.pdf') {
          return Promise.resolve({
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
          })
        }
        return Promise.resolve(null)
      })

      const result = await getFilesInfo([
        'project-123:/uploads/file1.pdf',
        'project-123:/uploads/file2.pdf',
      ])

      expect(result).toHaveLength(2)
      expect(result[0]?.file_name).toBe('file1.pdf')
      expect(result[1]?.file_name).toBe('file2.pdf')
    })

    it('filters out null results', async () => {
      const { getStorageFile: mockGetStorageFile } = await import('../metadata')

      mockGetStorageFile.mockImplementation((storagePath) => {
        if (storagePath === 'project-123:/uploads/file1.pdf') {
          return Promise.resolve({
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
          })
        }
        return Promise.resolve(null)
      })

      const result = await getFilesInfo([
        'project-123:/uploads/file1.pdf',
        'project-123:/uploads/nonexistent.pdf',
      ])

      expect(result).toHaveLength(1)
      expect(result[0]?.file_name).toBe('file1.pdf')
    })
  })
})
