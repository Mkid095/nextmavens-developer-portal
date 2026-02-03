/**
 * deleteStorageFile Tests
 *
 * Tests for deleting storage file records.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { deleteStorageFile } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains, assertQueryWithArray } from './test-helpers'
import { setupMockPool } from './vitest-mock'

describe('deleteStorageFile', () => {
  beforeEach(setupMockPool)

  it('deletes file record', async () => {
    mockQueryResolved([{ id: 'record-123' }])

    const result = await deleteStorageFile('project-123:/uploads/file.pdf')

    expect(result).toBe(true)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'DELETE FROM control_plane.storage_files')
    assertQueryWithArray(call, ['project-123:/uploads/file.pdf'])
  })

  it('returns false when file not found', async () => {
    mockQueryResolved([])

    const result = await deleteStorageFile('project-123:/uploads/nonexistent.pdf')

    expect(result).toBe(false)
  })
})
