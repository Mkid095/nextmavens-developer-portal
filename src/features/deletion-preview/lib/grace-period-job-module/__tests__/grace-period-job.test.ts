/**
 * Grace Period Job Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateDaysUntil,
  categorizeProject,
  categorizeProjects,
} from '../utils'
import { findProjectsInGracePeriod, hardDeleteProjectInTransaction } from '../db'
import { hardDeleteProject } from '../hard-delete'
import { getPool } from '@/lib/db'

// Mock getPool
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

describe('grace-period-job-module', () => {
  const mockPool = {
    query: vi.fn(),
    connect: vi.fn(),
  }

  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('calculateDaysUntil', () => {
    it('should calculate days until grace period ends', () => {
      const now = new Date('2026-01-01T00:00:00Z')
      const gracePeriodEnd = new Date('2026-01-08T00:00:00Z') // 7 days later

      const result = calculateDaysUntil(now, gracePeriodEnd)

      expect(result.daysUntilEnd).toBe(7)
      // daysPastEnd will be negative when grace period is still in the future
      expect(result.daysPastEnd).toBeLessThan(0)
    })

    it('should calculate days past grace period end', () => {
      const now = new Date('2026-01-08T00:00:00Z')
      const gracePeriodEnd = new Date('2026-01-01T00:00:00Z') // 7 days earlier

      const result = calculateDaysUntil(now, gracePeriodEnd)

      expect(result.daysUntilEnd).toBe(-7)
      expect(result.daysPastEnd).toBe(7)
    })

    it('should handle same day', () => {
      const now = new Date('2026-01-01T12:00:00Z')
      const gracePeriodEnd = new Date('2026-01-01T00:00:00Z') // 12 hours earlier

      const result = calculateDaysUntil(now, gracePeriodEnd)

      expect(result.daysPastEnd).toBe(0) // Should floor to 0 for same day
    })

    it('should calculate fractional days correctly', () => {
      const now = new Date('2026-01-01T00:00:00Z')
      const gracePeriodEnd = new Date('2026-01-02T12:00:00Z') // 1.5 days later

      const result = calculateDaysUntil(now, gracePeriodEnd)

      expect(result.daysUntilEnd).toBe(2) // Should ceil
    })
  })

  describe('categorizeProject', () => {
    const baseProject = {
      id: 'proj-1',
      name: 'Test Project',
      slug: 'test-project',
      tenant_id: 'tenant-1',
      deletion_scheduled_at: new Date('2026-01-01'),
      grace_period_ends_at: new Date('2026-01-08'),
    }

    it('should categorize project as near expiration', () => {
      const now = new Date('2026-01-06T00:00:00Z') // 2 days before grace period ends
      const project = { ...baseProject, grace_period_ends_at: new Date('2026-01-08') }

      const result = categorizeProject(project, now)

      expect(result.type).toBe('near_expiration')
      expect(result.data).toBeDefined()
      expect(result.data?.daysUntilHardDelete).toBe(2)
    })

    it('should categorize project for hard delete when past grace period', () => {
      const now = new Date('2026-01-10T00:00:00Z') // 2 days after grace period ends
      const project = { ...baseProject, grace_period_ends_at: new Date('2026-01-08') }

      const result = categorizeProject(project, now)

      expect(result.type).toBe('to_hard_delete')
      expect(result.data).toBeDefined()
      expect(result.data?.daysPastGracePeriod).toBe(2)
    })

    it('should return none when project is not near expiration', () => {
      const now = new Date('2026-01-01T00:00:00Z') // 8 days before grace period ends
      const project = { ...baseProject, grace_period_ends_at: new Date('2026-01-09') }

      const result = categorizeProject(project, now)

      expect(result.type).toBe('none')
      expect(result.data).toBeUndefined()
    })

    it('should categorize exactly 7 days as near expiration', () => {
      const now = new Date('2026-01-01T00:00:00Z')
      const project = { ...baseProject, grace_period_ends_at: new Date('2026-01-08') }

      const result = categorizeProject(project, now)

      expect(result.type).toBe('near_expiration')
      expect(result.data?.daysUntilHardDelete).toBe(7)
    })

    it('should categorize less than 7 days as near expiration', () => {
      const now = new Date('2026-01-02T00:00:00Z')
      const project = { ...baseProject, grace_period_ends_at: new Date('2026-01-08') }

      const result = categorizeProject(project, now)

      expect(result.type).toBe('near_expiration')
      expect(result.data?.daysUntilHardDelete).toBe(6)
    })
  })

  describe('categorizeProjects', () => {
    it('should categorize multiple projects correctly', () => {
      // Use real dates relative to now for more realistic test
      const now = new Date()
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      const projects = [
        {
          id: 'proj-1',
          name: 'Near Expiration',
          slug: 'near-exp',
          tenant_id: 'tenant-1',
          deletion_scheduled_at: new Date(),
          grace_period_ends_at: oneDayFromNow, // 1 day left
        },
        {
          id: 'proj-2',
          name: 'To Delete',
          slug: 'to-del',
          tenant_id: 'tenant-2',
          deletion_scheduled_at: new Date(),
          grace_period_ends_at: twoDaysAgo, // 2 days past
        },
        {
          id: 'proj-3',
          name: 'Not Near',
          slug: 'not-near',
          tenant_id: 'tenant-3',
          deletion_scheduled_at: new Date(),
          grace_period_ends_at: twoWeeksFromNow, // 2 weeks left
        },
      ]

      const result = categorizeProjects(projects)

      expect(result.projectsNearExpiration).toHaveLength(1)
      expect(result.projectsNearExpiration[0].projectId).toBe('proj-1')
      expect(result.projectsToHardDelete).toHaveLength(1)
      expect(result.projectsToHardDelete[0].projectId).toBe('proj-2')
      expect(result.projectsNeedingNotification).toHaveLength(1)
      expect(result.projectsNeedingNotification[0].projectId).toBe('proj-1')
    })

    it('should handle empty projects array', () => {
      const result = categorizeProjects([])

      expect(result.projectsNearExpiration).toEqual([])
      expect(result.projectsToHardDelete).toEqual([])
      expect(result.projectsNeedingNotification).toEqual([])
    })

    it('should categorize all near expiration projects as needing notification', () => {
      // Use real dates relative to now for more realistic test
      const now = new Date()
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

      const projects = [
        {
          id: 'proj-1',
          name: 'Near 1',
          slug: 'near-1',
          tenant_id: 'tenant-1',
          deletion_scheduled_at: new Date(),
          grace_period_ends_at: threeDaysFromNow,
        },
        {
          id: 'proj-2',
          name: 'Near 2',
          slug: 'near-2',
          tenant_id: 'tenant-2',
          deletion_scheduled_at: new Date(),
          grace_period_ends_at: fiveDaysFromNow,
        },
      ]

      const result = categorizeProjects(projects)

      expect(result.projectsNearExpiration).toHaveLength(2)
      expect(result.projectsNeedingNotification).toHaveLength(2)
    })
  })

  describe('findProjectsInGracePeriod', () => {
    it('should return projects in grace period', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Test Project',
          slug: 'test-project',
          tenant_id: 'tenant-1',
          deletion_scheduled_at: new Date('2026-01-01'),
          grace_period_ends_at: new Date('2026-01-08'),
        },
      ]

      mockPool.query.mockResolvedValueOnce({ rows: mockProjects })

      const result = await findProjectsInGracePeriod(mockPool)

      expect(result).toEqual(mockProjects)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, slug, tenant_id')
      )
    })

    it('should return empty array when no projects found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await findProjectsInGracePeriod(mockPool)

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      await expect(findProjectsInGracePeriod(mockPool)).rejects.toThrow('Database error')
    })
  })

  describe('hardDeleteProjectInTransaction', () => {
    it('should hard delete project successfully', async () => {
      const project = {
        projectId: 'proj-1',
        projectSlug: 'test-project',
      }

      await hardDeleteProjectInTransaction(mockClient, project)

      // Verify all delete operations were called
      expect(mockClient.query).toHaveBeenCalledTimes(7)
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DROP SCHEMA IF EXISTS tenant_test-project')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM control_plane.api_keys WHERE project_id = $1',
        ['proj-1']
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM control_plane.webhooks WHERE project_id = $1',
        ['proj-1']
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM control_plane.edge_functions WHERE project_id = $1',
        ['proj-1']
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM control_plane.storage_buckets WHERE project_id = $1',
        ['proj-1']
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM control_plane.secrets WHERE project_id = $1',
        ['proj-1']
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE control_plane.projects SET deleted_at = NOW() WHERE id = $1',
        ['proj-1']
      )
    })

    it('should handle schema drop failures gracefully', async () => {
      const project = {
        projectId: 'proj-1',
        projectSlug: 'test-project',
      }

      mockClient.query
        .mockRejectedValueOnce(new Error('Schema not found')) // DROP SCHEMA
        .mockResolvedValueOnce({ rows: [] }) // DELETE api_keys
        .mockResolvedValueOnce({ rows: [] }) // DELETE webhooks
        .mockResolvedValueOnce({ rows: [] }) // DELETE edge_functions
        .mockResolvedValueOnce({ rows: [] }) // DELETE storage_buckets
        .mockResolvedValueOnce({ rows: [] }) // DELETE secrets
        .mockResolvedValueOnce({ rows: [] }) // UPDATE deleted_at

      await hardDeleteProjectInTransaction(mockClient, project)

      // Should continue with other deletes despite schema drop failure
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM control_plane.api_keys WHERE project_id = $1',
        ['proj-1']
      )
    })
  })

  describe('hardDeleteProject', () => {
    it('should hard delete project with transaction', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient)
      mockClient.query.mockResolvedValue({})

      const project = {
        projectId: 'proj-1',
        projectName: 'Test Project',
        projectSlug: 'test-project',
        tenantId: 'tenant-1',
        gracePeriodEndsAt: new Date('2026-01-01'),
        daysPastGracePeriod: 1,
      }

      await hardDeleteProject(mockPool, project)

      expect(mockPool.connect).toHaveBeenCalled()
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should rollback on error', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient)
      mockClient.query.mockRejectedValueOnce(new Error('Delete failed'))

      const project = {
        projectId: 'proj-1',
        projectName: 'Test Project',
        projectSlug: 'test-project',
        tenantId: 'tenant-1',
        gracePeriodEndsAt: new Date('2026-01-01'),
        daysPastGracePeriod: 1,
      }

      await expect(hardDeleteProject(mockPool, project)).rejects.toThrow('Delete failed')

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should always release client', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient)
      mockClient.query.mockRejectedValueOnce(new Error('Error'))

      const project = {
        projectId: 'proj-1',
        projectName: 'Test Project',
        projectSlug: 'test-project',
        tenantId: 'tenant-1',
        gracePeriodEndsAt: new Date('2026-01-01'),
        daysPastGracePeriod: 1,
      }

      try {
        await hardDeleteProject(mockPool, project)
      } catch {
        // Expected to throw
      }

      expect(mockClient.release).toHaveBeenCalled()
    })
  })
})
