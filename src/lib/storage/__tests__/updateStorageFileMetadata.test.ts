/**
 * updateStorageFileMetadata Tests
 *
 * Tests for updating file metadata.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { updateStorageFileMetadata } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains, assertQueryWithArray, assertStorageFileEquals } from './test-helpers'
import { createMockFile } from './setup'
import { setupMockPool } from './vitest-mock'

describe('updateStorageFileMetadata', () => {
  beforeEach(setupMockPool)

  it('updates file metadata', async () => {
    const mockFile = createMockFile({ metadata: { updated: 'value' } })
    mockQueryResolved([mockFile])

    const result = await updateStorageFileMetadata('project-123:/uploads/file.pdf', {
      updated: 'value',
    })

    assertStorageFileEquals(result, mockFile)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'SET metadata = $2')
    const [_query, params] = call
    expect(params[0]).toBe('project-123:/uploads/file.pdf')
    expect(JSON.parse(params[1])).toEqual({ updated: 'value' })
  })

  it('returns null when file not found', async () => {
    mockQueryResolved([])

    const result = await updateStorageFileMetadata(
      'project-123:/uploads/nonexistent.pdf',
      { test: 'value' }
    )

    expect(result).toBeNull()
  })
})
