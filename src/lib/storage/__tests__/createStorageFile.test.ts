/**
 * createStorageFile Tests
 *
 * Tests for creating storage file records with conflict handling.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  createStorageFile,
  type StorageFile,
} from '../metadata'
import {
  createMockFile,
  mockQueryResolved,
} from './setup'
import {
  assertQueryContains,
  assertQueryWithArray,
  assertStorageFileEquals,
} from './test-helpers'

describe('createStorageFile', () => {
  beforeEach(setupMockPool)

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

    mockQueryResolved([mockFile])

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

    assertStorageFileEquals(result, mockFile)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'INSERT INTO control_plane.storage_files')
    assertQueryWithArray(call, [1, 'project-123:/uploads/file.pdf', 'file.pdf', 1024])
  })

  it('updates existing record on conflict', async () => {
    const mockFile: StorageFile = {
      id: 'record-123',
      project_id: 1,
      storage_path: 'project-123:/uploads/file.pdf',
      file_name: 'file.pdf',
      file_size: 2048,
      content_type: 'application/pdf',
      backend: 'telegram',
      file_id: 'f_test',
      file_url: 'https://telegram-api.com/files/f_test',
      uploaded_at: new Date(),
    }

    mockQueryResolved([mockFile])

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
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'ON CONFLICT (storage_path)')
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

    mockQueryResolved([mockFile])

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
