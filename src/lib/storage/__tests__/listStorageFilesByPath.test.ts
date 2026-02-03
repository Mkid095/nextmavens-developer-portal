/**
 * listStorageFilesByPath Tests
 *
 * Tests for listing files by path prefix.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { listStorageFilesByPath } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains } from './test-helpers'
import type { StorageFile } from '../metadata'
import { setupMockPool } from './vitest-mock'

describe('listStorageFilesByPath', () => {
  beforeEach(setupMockPool)

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

    mockQueryResolved(mockFiles)

    const result = await listStorageFilesByPath(1, 'project-123:/uploads/photos', 100)

    expect(result).toHaveLength(1)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, "storage_path LIKE $2")
  })
})
