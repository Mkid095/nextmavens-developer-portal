/**
 * listStorageFiles Tests
 *
 * Tests for listing storage files with pagination.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { listStorageFiles } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains, assertQueryWithLimitOffset } from './test-helpers'
import type { StorageFile } from '../metadata'
import { setupMockPool } from './vitest-mock'

describe('listStorageFiles', () => {
  beforeEach(setupMockPool)

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

    mockQueryResolved(mockFiles)

    const result = await listStorageFiles(1, 100, 0)

    expect(result).toHaveLength(2)
    expect(result[0].file_name).toBe('file1.pdf')
    expect(result[1].file_name).toBe('file2.pdf')
  })

  it('applies limit and offset', async () => {
    mockQueryResolved([])

    await listStorageFiles(1, 50, 10)

    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'LIMIT $2 OFFSET $3')
    assertQueryWithLimitOffset(call, 1, 50, 10)
  })
})
