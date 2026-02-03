/**
 * Auto-Activation Job Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

vi.mock('@nextmavenspacks/audit-logs-database', () => ({
  logProjectAction: {
    updated: vi.fn().mockResolvedValue(undefined),
  },
  systemActor: vi.fn(() => ({ id: 'system', type: 'system' })),
}))

vi.mock('@/lib/types/project-lifecycle.types', () => ({
  ProjectStatus: {
    CREATED: 'created',
    ACTIVE: 'active',
  },
  isValidTransition: vi.fn(() => true),
}))

vi.mock('@/lib/provisioning/state-machine', () => ({
  getAllSteps: vi.fn(),
  isProvisioningComplete: vi.fn(() => false),
  hasProvisioningFailed: vi.fn(() => false),
}))

import {
  runAutoActivationJob,
  getProjectsReadyForActivation,
} from '..'
import { getPool } from '@/lib/db'

// Import the mocked modules to access their mocks
import { getAllSteps, isProvisioningComplete, hasProvisioningFailed } from '@/lib/provisioning/state-machine'

describe('auto-activation-job-module', () => {
  const mockPool = {
    query: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('runAutoActivationJob', () => {
    it('should activate projects with complete provisioning', async () => {
      // Mock created projects
      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'proj-1',
              project_name: 'Test Project',
              status: 'created',
              owner_id: 'user-1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // Update

      // Mock provisioning steps as complete
      vi.mocked(getAllSteps).mockResolvedValueOnce([
        { id: 'step-1', status: 'success' },
        { id: 'step-2', status: 'success' },
      ])
      vi.mocked(isProvisioningComplete).mockReturnValueOnce(true)

      const result = await runAutoActivationJob()

      expect(result.success).toBe(true)
      expect(result.projectsActivated).toBe(1)
      expect(result.activatedProjects).toHaveLength(1)
      expect(result.activatedProjects[0]).toMatchObject({
        projectId: 'proj-1',
        projectName: 'Test Project',
      })
    })

    it('should return empty result when no created projects exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      const result = await runAutoActivationJob()

      expect(result.success).toBe(true)
      expect(result.projectsChecked).toBe(0)
      expect(result.projectsActivated).toBe(0)
      expect(result.activatedProjects).toHaveLength(0)
    })

    it('should skip projects with incomplete provisioning', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 'proj-1',
            project_name: 'Test Project',
            status: 'created',
            owner_id: 'user-1',
          },
        ],
      })

      vi.mocked(getAllSteps).mockResolvedValueOnce([
        { id: 'step-1', status: 'success' },
        { id: 'step-2', status: 'pending' },
      ])
      vi.mocked(isProvisioningComplete).mockReturnValueOnce(false)
      vi.mocked(hasProvisioningFailed).mockReturnValueOnce(false)

      const result = await runAutoActivationJob()

      expect(result.projectsActivated).toBe(0)
      expect(result.failedProvisioning).toBe(0)
    })

    it('should count projects with failed provisioning', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 'proj-1',
            project_name: 'Failed Project',
            status: 'created',
            owner_id: 'user-1',
          },
        ],
      })

      vi.mocked(getAllSteps).mockResolvedValueOnce([
        { id: 'step-1', status: 'success' },
        { id: 'step-2', status: 'failed' },
      ])
      vi.mocked(isProvisioningComplete).mockReturnValueOnce(false)
      vi.mocked(hasProvisioningFailed).mockReturnValueOnce(true)

      const result = await runAutoActivationJob()

      expect(result.projectsActivated).toBe(0)
      expect(result.failedProvisioning).toBe(1)
    })

    it('should handle fatal errors and return error result', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Fatal error'))

      const result = await runAutoActivationJob()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Fatal error')
      expect(result.projectsActivated).toBe(0)
    })
  })

  describe('getProjectsReadyForActivation', () => {
    it('should return projects ready for activation', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            project_id: 'proj-1',
            project_name: 'Ready Project',
            owner_name: 'Test Owner',
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      })

      const result = await getProjectsReadyForActivation()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        projectId: 'proj-1',
        projectName: 'Ready Project',
        ownerName: 'Test Owner',
      })
    })

    it('should return empty array when no projects are ready', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })

      const result = await getProjectsReadyForActivation()

      expect(result).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValue(new Error('Database error'))

      const result = await getProjectsReadyForActivation()

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalled()
    })
  })
})
