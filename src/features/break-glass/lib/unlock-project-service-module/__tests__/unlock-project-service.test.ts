/**
 * Unlock Project Service Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { unlockProject, getUnlockHistory } from '..'
import { getPool } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

vi.mock('@/features/abuse-controls/lib/data-layer', () => ({
  SuspensionManager: {
    getStatus: vi.fn(),
    unsuspend: vi.fn(),
  },
}))

vi.mock('@/lib/snapshot', () => ({
  invalidateSnapshot: vi.fn(),
}))

vi.mock('../../admin-database', () => ({
  AdminActionType: {
    UNLOCK_PROJECT: 'unlock_project',
  },
  AdminTargetType: {
    PROJECT: 'project',
  },
  logAdminAction: vi.fn(),
}))

vi.mock('../../aggressive-audit-logger', () => ({
  logBreakGlassAction: vi.fn(),
}))

describe('unlock-project-service-module', () => {
  const mockPool = {
    query: vi.fn(),
  }

  const mockProject = {
    id: 'proj-123',
    project_name: 'Test Project',
    status: 'SUSPENDED',
    tenant_id: 'tenant-123',
    developer_id: 'dev-123',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  }

  const mockUpdatedProject = {
    id: 'proj-123',
    project_name: 'Test Project',
    status: 'ACTIVE',
    tenant_id: 'tenant-123',
    developer_id: 'dev-123',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
  }

  const mockSuspension = {
    suspended: true,
    cap_exceeded: true,
    reason: {
      cap_type: 'DB_QUERIES_PER_DAY',
      details: 'Exceeded daily query limit',
    },
    suspended_at: new Date('2026-01-01'),
    notes: 'Automatic suspension',
  }

  const mockAction = {
    id: 'action-123',
    session_id: 'session-123',
    action: 'unlock_project',
    target_type: 'project',
    target_id: 'proj-123',
    before_state: {},
    after_state: {},
    created_at: new Date('2026-01-02'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validators', () => {
    it('should validate valid unlock request', async () => {
      const { validateUnlockRequest } = await import('..')

      const result = validateUnlockRequest({
        projectId: 'proj-123',
        sessionId: 'session-123',
        adminId: 'admin-123',
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should fail validation with missing projectId', async () => {
      const { validateUnlockRequest } = await import('..')

      const result = validateUnlockRequest({
        projectId: '',
        sessionId: 'session-123',
        adminId: 'admin-123',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0].field).toBe('projectId')
    })

    it('should fail validation with missing sessionId', async () => {
      const { validateUnlockRequest } = await import('..')

      const result = validateUnlockRequest({
        projectId: 'proj-123',
        sessionId: '',
        adminId: 'admin-123',
      })

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].field).toBe('sessionId')
    })

    it('should fail validation with missing adminId', async () => {
      const { validateUnlockRequest } = await import('..')

      const result = validateUnlockRequest({
        projectId: 'proj-123',
        sessionId: 'session-123',
        adminId: '',
      })

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].field).toBe('adminId')
    })

    it('should fail validation with multiple missing fields', async () => {
      const { validateUnlockRequest } = await import('..')

      const result = validateUnlockRequest({
        projectId: '',
        sessionId: '',
        adminId: '',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })
  })

  describe('validateProjectExists', () => {
    it('should pass when project exists', async () => {
      const { validateProjectExists } = await import('..')

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'proj-123' }],
      })

      await expect(validateProjectExists(mockPool, 'proj-123')).resolves.not.toThrow()
    })

    it('should throw error when project does not exist', async () => {
      const { validateProjectExists } = await import('..')

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await expect(validateProjectExists(mockPool, 'proj-123')).rejects.toThrow()

      try {
        await validateProjectExists(mockPool, 'proj-123')
      } catch (error) {
        const err = JSON.parse((error as Error).message)
        expect(err.code).toBe('PROJECT_NOT_FOUND')
      }
    })
  })

  describe('db', () => {
    it('should get project successfully', async () => {
      const { getProject } = await import('..')

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
      })

      const result = await getProject(mockPool, 'proj-123')

      expect(result).toEqual(mockProject)
    })

    it('should update project status successfully', async () => {
      const { updateProjectStatus } = await import('..')

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUpdatedProject],
      })

      const result = await updateProjectStatus(mockPool, 'proj-123')

      expect(result).toEqual(mockUpdatedProject)
    })

    it('should get unlock history successfully', async () => {
      const { getUnlockHistoryQuery } = await import('..')

      mockPool.query.mockResolvedValueOnce({
        rows: [mockAction],
      })

      const result = await getUnlockHistoryQuery(mockPool, 'unlock_project', 'proj-123')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockAction)
    })
  })

  describe('state-capture', () => {
    it('should capture before state with suspension', async () => {
      const { captureBeforeState } = await import('..')

      const result = captureBeforeState(mockProject, mockSuspension)

      expect(result).toEqual({
        project_id: 'proj-123',
        project_name: 'Test Project',
        status: 'SUSPENDED',
        tenant_id: 'tenant-123',
        developer_id: 'dev-123',
        suspension: {
          suspended: true,
          cap_exceeded: true,
          reason: 'Exceeded daily query limit',
          suspended_at: new Date('2026-01-01'),
          notes: 'Automatic suspension',
        },
      })
    })

    it('should capture before state without suspension', async () => {
      const { captureBeforeState } = await import('..')

      const result = captureBeforeState(mockProject, null)

      expect(result.suspension).toEqual({
        suspended: false,
      })
    })

    it('should capture after state correctly', async () => {
      const { captureAfterState } = await import('..')

      const result = captureAfterState(mockUpdatedProject, mockProject, true, 'Testing unlock')

      expect(result).toEqual({
        project_id: 'proj-123',
        project_name: 'Test Project',
        status: 'ACTIVE',
        previous_status: 'SUSPENDED',
        tenant_id: 'tenant-123',
        developer_id: 'dev-123',
        suspension_cleared: true,
        unlocked_at: new Date('2026-01-02'),
        admin_reason: 'Testing unlock',
      })
    })

    it('should capture after state with null reason', async () => {
      const { captureAfterState } = await import('..')

      const result = captureAfterState(mockUpdatedProject, mockProject, false)

      expect(result.admin_reason).toBeNull()
    })
  })

  describe('handlers', () => {
    it('should clear suspension when shouldClear is true and suspension exists', async () => {
      const { clearSuspensionIfNeeded, SuspensionManager } = await import('..')

      const result = await clearSuspensionIfNeeded('proj-123', mockSuspension, true)

      expect(result).toBe(true)
      expect(SuspensionManager.unsuspend).toHaveBeenCalledWith(
        'proj-123',
        'Break glass unlock operation'
      )
    })

    it('should not clear suspension when shouldClear is false', async () => {
      const { clearSuspensionIfNeeded, SuspensionManager } = await import('..')

      const result = await clearSuspensionIfNeeded('proj-123', mockSuspension, false)

      expect(result).toBe(false)
      expect(SuspensionManager.unsuspend).not.toHaveBeenCalled()
    })

    it('should not clear suspension when suspension is null', async () => {
      const { clearSuspensionIfNeeded, SuspensionManager } = await import('..')

      const result = await clearSuspensionIfNeeded('proj-123', null, true)

      expect(result).toBe(false)
      expect(SuspensionManager.unsuspend).not.toHaveBeenCalled()
    })

    it('should update project to active', async () => {
      const { updateProjectToActive } = await import('..')

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUpdatedProject],
      })

      const result = await updateProjectToActive(mockPool, 'proj-123')

      expect(result).toEqual({
        id: 'proj-123',
        project_name: 'Test Project',
        status: 'ACTIVE',
        updated_at: new Date('2026-01-02'),
      })
    })

    it('should invalidate project snapshot', async () => {
      const { invalidateProjectSnapshot, invalidateSnapshot } = await import('..')

      invalidateProjectSnapshot('proj-123')

      expect(invalidateSnapshot).toHaveBeenCalledWith('proj-123')
    })
  })

  describe('builders', () => {
    it('should build unlocked project state with previous suspension', async () => {
      const { buildUnlockedProjectState } = await import('..')

      const result = buildUnlockedProjectState(mockUpdatedProject, 'SUSPENDED', mockSuspension)

      expect(result).toEqual({
        id: 'proj-123',
        name: 'Test Project',
        status: 'ACTIVE',
        previous_status: 'SUSPENDED',
        unlocked_at: new Date('2026-01-02'),
        previous_suspension: {
          cap_exceeded: true,
          reason: 'DB_QUERIES_PER_DAY',
          suspended_at: new Date('2026-01-01'),
          notes: 'Automatic suspension',
        },
      })
    })

    it('should build unlocked project state without previous suspension', async () => {
      const { buildUnlockedProjectState } = await import('..')

      const result = buildUnlockedProjectState(mockUpdatedProject, 'SUSPENDED', undefined)

      expect(result.previous_suspension).toBeUndefined()
    })

    it('should build action log correctly', async () => {
      const { buildActionLog } = await import('..')

      const result = buildActionLog(mockAction)

      expect(result).toEqual({
        id: 'action-123',
        session_id: 'session-123',
        action: 'unlock_project',
        target_type: 'project',
        target_id: 'proj-123',
        before_state: {},
        after_state: {},
        logged_at: new Date('2026-01-02'),
      })
    })

    it('should build unlock response without warning', async () => {
      const { buildUnlockResponse, buildUnlockedProjectState, buildActionLog } = await import('..')

      const unlockedProject = buildUnlockedProjectState(mockUpdatedProject, 'SUSPENDED', mockSuspension)
      const actionLog = buildActionLog(mockAction)

      const result = buildUnlockResponse(unlockedProject, actionLog, false, true)

      expect(result).toEqual({
        success: true,
        project: unlockedProject,
        action_log: actionLog,
      })
    })

    it('should build unlock response with warning when already active', async () => {
      const { buildUnlockResponse, buildUnlockedProjectState, buildActionLog } = await import('..')

      const unlockedProject = buildUnlockedProjectState(mockUpdatedProject, 'ACTIVE', undefined)
      const actionLog = buildActionLog(mockAction)

      const result = buildUnlockResponse(unlockedProject, actionLog, true, true)

      expect(result.warning).toBe('Project was already ACTIVE and had no suspension')
    })
  })

  describe('unlockProject', () => {
    const mockParams = {
      projectId: 'proj-123',
      sessionId: 'session-123',
      adminId: 'admin-123',
      reason: 'Testing unlock',
      clearSuspensionFlags: true,
    }

    beforeEach(() => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'proj-123' }] }) // validateProjectExists
        .mockResolvedValueOnce({ rows: [mockProject] }) // getProject
        .mockResolvedValueOnce({ rows: [mockUpdatedProject] }) // updateProjectStatus
    })

    it('should unlock project successfully with suspension', async () => {
      const { SuspensionManager } = await import('@/features/abuse-controls/lib/data-layer')
      const { logBreakGlassAction } = await import('../../aggressive-audit-logger')

      vi.mocked(SuspensionManager.getStatus).mockResolvedValue(mockSuspension)
      vi.mocked(logBreakGlassAction).mockResolvedValue(mockAction)

      const result = await unlockProject(mockParams)

      expect(result.success).toBe(true)
      expect(result.project.status).toBe('ACTIVE')
      expect(result.action_log).toBeDefined()
    })

    it('should unlock project successfully without suspension', async () => {
      const { SuspensionManager } = await import('@/features/abuse-controls/lib/data-layer')
      const { logBreakGlassAction } = await import('../../aggressive-audit-logger')

      vi.mocked(SuspensionManager.getStatus).mockResolvedValue(null)
      vi.mocked(logBreakGlassAction).mockResolvedValue(mockAction)

      const result = await unlockProject(mockParams)

      expect(result.success).toBe(true)
      expect(result.project.status).toBe('ACTIVE')
    })

    it('should fail with validation error for invalid params', async () => {
      await expect(unlockProject({
        projectId: '',
        sessionId: 'session-123',
        adminId: 'admin-123',
      })).rejects.toThrow()
    })

    it('should fail when project does not exist', async () => {
      mockPool.query.mockReset()
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await expect(unlockProject(mockParams)).rejects.toThrow()
    })
  })

  describe('getUnlockHistory', () => {
    it('should return unlock history', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [mockAction],
      })

      const result = await getUnlockHistory('proj-123')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'action-123',
        session_id: 'session-123',
        action: 'unlock_project',
        target_type: 'project',
        target_id: 'proj-123',
        before_state: {},
        after_state: {},
        logged_at: new Date('2026-01-02'),
      })
    })

    it('should return empty array when no history', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await getUnlockHistory('proj-123')

      expect(result).toEqual([])
    })
  })
})
