/**
 * getStorageUsage Tests
 *
 * Tests for calculating total storage usage.
 */

import { describe, it, expect } from 'vitest'
import { getStorageUsage } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains, assertQueryWithArray } from './test-helpers'

describe('getStorageUsage', () => {
  beforeEach(setupMockPool)

  it('returns total storage usage for project', async () => {
    mockQueryResolved([{ total: BigInt(10240000) }])

    const result = await getStorageUsage(1)

    expect(result).toBe(10240000)
    const call = mockQuery.mock.calls[0]
    assertQueryContains(call, 'COALESCE(SUM(file_size), 0)')
    assertQueryWithArray(call, [1])
  })

  it('returns 0 when no files', async () => {
    mockQueryResolved([{ total: BigInt(0) }])

    const result = await getStorageUsage(1)

    expect(result).toBe(0)
  })
})
