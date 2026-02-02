/**
 * Test Setup and Fixtures
 *
 * Shared test utilities and mock data for storage metadata tests.
 */

import { beforeEach } from 'vitest'
import type { StorageFile } from '../metadata'
import { mockQuery } from './vitest-mock'

// Common mock file objects
export const createMockFile = (overrides: Partial<StorageFile> = {}): StorageFile => ({
  id: 'record-123',
  project_id: 1,
  storage_path: 'project-123:/uploads/file.pdf',
  file_name: 'file.pdf',
  file_size: 1024,
  content_type: 'application/pdf',
  backend: 'telegram',
  file_id: 'f_test',
  file_url: 'https://telegram-api.com/files/f_test',
  uploaded_at: new Date(),
  ...overrides,
})

export const createMultipleMockFiles = (
  count: number,
  overrides: Partial<StorageFile> = {}
): StorageFile[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockFile({
      ...overrides,
      id: `record-${i + 1}`,
      file_name: `file${i + 1}.pdf`,
      storage_path: `project-123:/uploads/file${i + 1}.pdf`,
      file_id: `f_${i + 1}`,
      file_url: `https://telegram-api.com/files/f_${i + 1}`,
      uploaded_at: new Date(),
    })
  )
}

export const mockQueryResolved = <T = any>(rows: T[]) => {
  mockQuery.mockResolvedValueOnce({ rows })
}
