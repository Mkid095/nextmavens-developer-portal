/**
 * Incident Route Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getIncidentHandler, updateIncidentHandler } from '..'
import { getPool } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  verifyAccessToken: vi.fn(),
}))

describe('incident-route-module', () => {
  const mockPool = {
    query: vi.fn(),
  }

  const mockAuth = {
    id: 'user-123',
    email: 'admin@example.com',
    name: 'Admin User',
    organization: 'test-org',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getIncidentHandler', () => {
    it('should return incident details for authorized admin', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'admin@example.com', name: 'Admin User', role: 'admin' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'incident-1',
              service: 'database',
              status: 'active',
              title: 'Database Outage',
              description: 'Database is down',
              impact: 'high',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'update-1',
              message: 'Investigating',
              status: 'active',
              created_at: new Date(),
            },
          ],
        })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
      } as unknown as NextRequest

      const response = await getIncidentHandler(request, { id: 'incident-1' })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.incident).toBeDefined()
      expect(data.incident.updates).toBeDefined()
    })

    it('should return 404 when incident not found', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'admin@example.com', name: 'Admin User', role: 'admin' }],
        })
        .mockResolvedValueOnce({ rows: [] })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
      } as unknown as NextRequest

      const response = await getIncidentHandler(request, { id: 'incident-1' })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('NOT_FOUND')
    })

    it('should return 401 when no auth token provided', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockImplementation(() => {
        throw new Error('No token provided')
      })

      const request = {
        headers: {
          get: vi.fn(() => null),
        },
      } as unknown as NextRequest

      const response = await getIncidentHandler(request, { id: 'incident-1' })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 when user is not admin', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'user@example.com', name: 'Regular User', role: 'user' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'incident-1',
              service: 'database',
              status: 'active',
              title: 'Database Outage',
            },
          ],
        })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
      } as unknown as NextRequest

      const response = await getIncidentHandler(request, { id: 'incident-1' })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('FORBIDDEN')
    })
  })

  describe('updateIncidentHandler', () => {
    it('should update incident status successfully', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'admin@example.com', name: 'Admin User', role: 'admin' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'incident-1',
              service: 'database',
              status: 'active',
              title: 'Database Outage',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'incident-1',
              service: 'database',
              status: 'resolved',
              title: 'Database Outage',
            },
          ],
        })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({ status: 'resolved' }),
      } as unknown as NextRequest

      const response = await updateIncidentHandler(request, { id: 'incident-1' })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Incident updated')
    })

    it('should validate status parameter', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'admin@example.com', name: 'Admin User', role: 'admin' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'incident-1',
              service: 'database',
              status: 'active',
              title: 'Database Outage',
            },
          ],
        })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({ status: 'invalid_status' }),
      } as unknown as NextRequest

      const response = await updateIncidentHandler(request, { id: 'incident-1' })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_STATUS')
    })

    it('should return 404 when updating non-existent incident', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'admin@example.com', name: 'Admin User', role: 'admin' }],
        })
        .mockResolvedValueOnce({ rows: [] })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({ status: 'resolved' }),
      } as unknown as NextRequest

      const response = await updateIncidentHandler(request, { id: 'incident-1' })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.code).toBe('NOT_FOUND')
    })

    it('should auto-set resolved_at when status changes to resolved', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'admin@example.com', name: 'Admin User', role: 'admin' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'incident-1',
              service: 'database',
              status: 'active',
              resolved_at: null,
            },
          ],
        })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({ status: 'resolved' }),
      } as unknown as NextRequest

      await updateIncidentHandler(request, { id: 'incident-1' })

      // Check that the update query included resolved_at
      const updateCall = mockPool.query.calls.find((call: any) =>
        call[0]?.includes?.('UPDATE control_plane.incidents') && call[0]?.includes?.('resolved_at = NOW()'))
      )
      expect(updateCall).toBeDefined()
    })

    it('should clear resolved_at when status changes back to active', async () => {
      const { verifyAccessToken } = await import('@/lib/auth')

      vi.mocked(verifyAccessToken).mockReturnValue({ id: 'user-123' })

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123', email: 'admin@example.com', name: 'Admin User', role: 'admin' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'incident-1',
              service: 'database',
              status: 'resolved',
              resolved_at: new Date(),
            },
          ],
        })

      const request = {
        headers: {
          get: vi.fn((name) => (name === 'authorization' ? 'Bearer token' : null)),
        },
        json: async () => ({ status: 'active' }),
      } as unknown as NextRequest

      await updateIncidentHandler(request, { id: 'incident-1' })

      const updateCall = mockPool.query.calls.find((call: any) =>
        call[0]?.includes?.('resolved_at = NULL')
      )
      expect(updateCall).toBeDefined()
    })
  })
})
