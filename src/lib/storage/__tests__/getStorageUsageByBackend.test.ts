/**
 * getStorageUsageByBackend Tests
 *
 * Tests for calculating storage usage breakdown by backend.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { getStorageUsageByBackend } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains } from './test-helpers'
import { setupMockPool } from './vitest-mock'

describe('getStorageUsageByBackend', () => {
  beforeEach(setupMockPool)

  it('returns usage breakdown by backend', async () => {
    mockQueryResolved([
      { backend: 'telegram', total: BigInt(10240000) },
      { backend: 'cloudinary', total: BigInt(5120000) },
    ])

    const result = await getStorageUsageByBackend(1)

    expect(result).toEqual({
      telegram: 10240000,
      cloudinary: 5120000,
      total: 15360000,
    })
  })

  it('returns zeros when no files', async () => {
    mockQueryResolved([])

    const result = await getStorageUsageByBackend(1)

    expect(result).toEqual({
      telegram: 0,
      cloudinary: 0,
      total: 0,
    })
  })
})
