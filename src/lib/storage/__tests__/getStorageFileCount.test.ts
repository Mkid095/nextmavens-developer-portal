/**
 * getStorageFileCount Tests
 *
 * Tests for counting files in storage.
 */

import { describe, it, expect } from 'vitest'
import { getStorageFileCount } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains, assertQueryWithArray } from './test-helpers'

describe('getStorageFileCount', () => {
  beforeEach(setupMockPool)

  it('returns file count for project', async () => {
    mockQueryResolved([{ count: BigInt(42) }])

    const result = await getStorageFileCount(1)

    expect(result).toBe(42)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'COUNT(*)')
    assertQueryWithArray(call, [1])
  })
})
