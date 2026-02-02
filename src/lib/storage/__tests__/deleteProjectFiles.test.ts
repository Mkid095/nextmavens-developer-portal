/**
 * deleteProjectFiles Tests
 *
 * Tests for deleting all files for a project.
 */

import { describe, it, expect } from 'vitest'
import { deleteProjectFiles } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains, assertQueryWithArray } from './test-helpers'

describe('deleteProjectFiles', () => {
  beforeEach(setupMockPool)

  it('deletes all files for a project', async () => {
    mockQueryResolved([{ count: BigInt(15) }])

    const result = await deleteProjectFiles(1)

    expect(result).toBe(15)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'DELETE FROM control_plane.storage_files')
    assertQueryWithArray(call, [1])
  })

  it('returns 0 when no files deleted', async () => {
    mockQueryResolved([{ count: BigInt(0) }])

    const result = await deleteProjectFiles(1)

    expect(result).toBe(0)
  })
})
