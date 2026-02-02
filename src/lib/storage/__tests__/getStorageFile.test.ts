/**
 * getStorageFile Tests
 *
 * Tests for retrieving storage files by storage path.
 */

import { describe, it, expect, vi } from 'vitest'
import { getStorageFile } from '../metadata'
import { mockQueryResolved, createMockFile } from './setup'
import { assertQueryContains, assertQueryWithArray, assertStorageFileEquals } from './test-helpers'

describe('getStorageFile', () => {
  beforeEach(setupMockPool)

  it('retrieves file by storage path', async () => {
    const mockFile = createMockFile()
    mockQueryResolved([mockFile])

    const result = await getStorageFile('project-123:/uploads/file.pdf')

    assertStorageFileEquals(result, mockFile)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'WHERE storage_path = $1')
    assertQueryWithArray(call, ['project-123:/uploads/file.pdf'])
  })

  it('returns null when file not found', async () => {
    mockQueryResolved([])

    const result = await getStorageFile('project-123:/uploads/nonexistent.pdf')

    expect(result).toBeNull()
  })
})
