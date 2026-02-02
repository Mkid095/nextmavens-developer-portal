/**
 * listStorageFilesByBackend Tests
 *
 * Tests for listing files by backend type.
 */

import { describe, it, expect } from 'vitest'
import { listStorageFilesByBackend } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains } from './test-helpers'
import type { StorageFile } from '../metadata'

  getPool: vi.fn(() => ({
    query: vi.fn(),
  })),
}))

describe('listStorageFilesByBackend', () => {
  beforeEach(setupMockPool)

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

    mockQueryResolved(mockFiles)

    const result = await listStorageFilesByBackend(1, 'cloudinary', 100)

    expect(result).toHaveLength(1)
    expect(result[0].backend).toBe('cloudinary')
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'backend = $2')
  })
})
