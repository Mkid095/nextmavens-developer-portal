/**
 * Test Helpers
 *
 * Reusable test assertion helpers for storage metadata tests.
 */

import type { StorageFile } from '../metadata'

// Database query query builder helpers
export const assertQueryContains = (
  call: ReturnType<ReturnType<typeof vi.fn>['mock'][0]['toHaveBeenCalledWith']>,
  expectedPattern: string
) => {
  const [query] = call
  expect(query).toContain(expectedPattern)
}

export const assertQueryWithArray = (
  call: ReturnType<ReturnType<typeof vi.fn>['mock'][0]['toHaveBeenCalledWith']>,
  expectedArray: any[]
) => {
  const [_query, params] = call
  expect(params).toEqual(expectedArray)
}

export const assertQueryWithLimitOffset = (
  call: ReturnType<ReturnType<typeof vi.fn>['mock'][0]['toHaveBeenCalledWith']>,
  projectId: number,
  limit: number,
  offset: number
) => {
  const [_query, params] = call
  expect(params).toEqual([projectId, limit, offset])
}

// Storage file assertion helpers
export const assertStorageFileEquals = (actual: StorageFile, expected: StorageFile) => {
  expect(actual).toEqual(expected)
}

export const assertStorageFilesArray = (actual: StorageFile[], expected: StorageFile[]) => {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((file, index) => {
    assertStorageFileEquals(file, expected[index])
  })
}

// Mock pool setup
export const withMockPool = (callback: () => Promise<void>) => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { getPool } = require('@/lib/db')
    getPool.mockReturnValue({ query: mockQuery })
    callback()
  })
}
