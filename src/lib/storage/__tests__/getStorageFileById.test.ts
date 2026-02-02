/**
 * getStorageFileById Tests
 *
 * Tests for retrieving storage files by ID.
 */

import { describe, it, expect } from 'vitest'
import { getStorageFileById } from '../metadata'
import { mockQueryResolved, createMockFile } from './setup'
import { assertQueryContains, assertQueryWithArray, assertStorageFileEquals } from './test-helpers'

describe('getStorageFileById', () => {
  beforeEach(setupMockPool)

  it('retrieves file by ID', async () => {
    const mockFile = createMockFile()
    mockQueryResolved([mockFile])

    const result = await getStorageFileById('record-123')

    assertStorageFileEquals(result, mockFile)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'WHERE id = $1')
    assertQueryWithArray(call, ['record-123'])
  })

  it('returns null when file not found', async () => {
    mockQueryResolved([])

    const result = await getStorageFileById('nonexistent')

    expect(result).toBeNull()
  })
})
