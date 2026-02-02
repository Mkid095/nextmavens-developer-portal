/**
 * getStorageStats Tests
 *
 * Tests for comprehensive storage statistics.
 */

import { describe, it, expect } from 'vitest'
import { getStorageStats } from '../metadata'
import { mockQueryResolved } from './setup'
import { assertQueryContains, assertQueryWithArray } from './test-helpers'

  getPool: vi.fn(() => ({
    query: vi.fn(),
  })),
}))

describe('getStorageStats', () => {
  beforeEach(setupMockPool)

  it('returns comprehensive storage statistics', async () => {
    mockQueryResolved([
      {
        total_bytes: BigInt(10240000),
        file_count: BigInt(10),
        largest_file_name: 'large-file.pdf',
        largest_file_size: BigInt(5120000),
        largest_file_backend: 'telegram',
        average_file_size: BigInt(1024000),
        telegram_bytes: BigInt(7680000),
        telegram_count: BigInt(7),
        cloudinary_bytes: BigInt(2560000),
        cloudinary_count: BigInt(3),
      },
    ])

    const result = await getStorageStats(1)

    expect(result).toEqual({
      totalBytes: 10240000,
      fileCount: 10,
      largestFile: {
        name: 'large-file.pdf',
        size: 5120000,
        backend: 'telegram',
      },
      averageFileSize: 1024000,
      backendBreakdown: {
        telegram: { bytes: 7680000, count: 7 },
        cloudinary: { bytes: 2560000, count: 3 },
      },
    })
  })

  it('handles empty project', async () => {
    mockQueryResolved([
      {
        total_bytes: BigInt(0),
        file_count: BigInt(0),
        largest_file_name: null,
        largest_file_size: null,
        largest_file_backend: null,
        average_file_size: BigInt(0),
        telegram_bytes: BigInt(0),
        telegram_count: BigInt(0),
        cloudinary_bytes: BigInt(0),
        cloudinary_count: BigInt(0),
      },
    ])

    const result = await getStorageStats(1)

    expect(result.totalBytes).toBe(0)
    expect(result.fileCount).toBe(0)
    expect(result.largestFile).toBeNull()
  })
})
