/**
 * Tests for webhook delivery
 *
 * Tests webhook delivery, signature generation, and idempotency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  deliverWebhook,
  createEventLog,
  findWebhooksForEvent,
  emitEvent,
  emitPlatformEvent,
} from '../webhook-delivery'
import { getPool } from '@/lib/db'
import type { Webhook } from '@/features/webhooks/types'

// Mock dependencies
vi.mock('@/lib/db')
vi.mock('@/lib/idempotency')

const mockPool = {
  query: vi.fn(),
}

vi.mocked(getPool).mockReturnValue(mockPool as never)

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Webhook Delivery', () => {
  const mockWebhook: Webhook = {
    id: 'webhook-123',
    project_id: 'project-123',
    event: 'project.created',
    target_url: 'https://example.com/webhook',
    secret: 'webhook-secret',
    enabled: true,
    consecutive_failures: 0,
    created_at: new Date(),
    updated_at: new Date(),
  }

  const mockPayload = {
    event_type: 'project.created',
    project_id: 'project-123',
    data: { name: 'Test Project' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool.query.mockResolvedValue({ rows: [] })
  })

  describe('deliverWebhook', () => {
    it('should deliver webhook successfully', async () => {
      // Mock idempotency wrapper
      const { withIdempotency } = await import('@/lib/idempotency')
      vi.mocked(withIdempotency).mockImplementation(async (key, fn) => {
        return fn()
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'OK',
        headers: new Headers(),
      })

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await deliverWebhook('event-123', mockWebhook, mockPayload)

      expect(result.success).toBe(true)
      expect(result.statusCode).toBe(200)
      expect(result.delivered).toBe(true)
    })

    it('should include signature headers', async () => {
      const { withIdempotency } = await import('@/lib/idempotency')
      vi.mocked(withIdempotency).mockImplementation(async (key, fn) => {
        return fn()
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'OK',
        headers: new Headers(),
      })

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await deliverWebhook('event-123', mockWebhook, mockPayload)

      expect(mockFetch).toHaveBeenCalledWith(
        mockWebhook.target_url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Signature': expect.stringContaining('sha256='),
            'X-Webhook-Event': mockWebhook.event,
          }),
        })
      )
    })

    it('should handle webhook delivery failure', async () => {
      const { withIdempotency } = await import('@/lib/idempotency')
      vi.mocked(withIdempotency).mockImplementation(async (key, fn) => {
        return fn()
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        headers: new Headers(),
      })

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await deliverWebhook('event-123', mockWebhook, mockPayload)

      expect(result.success).toBe(false)
      expect(result.statusCode).toBe(500)
      expect(result.delivered).toBe(false)
    })

    it('should handle network errors', async () => {
      const { withIdempotency } = await import('@/lib/idempotency')
      vi.mocked(withIdempotency).mockImplementation(async (key, fn) => {
        return fn()
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await deliverWebhook('event-123', mockWebhook, mockPayload)

      expect(result.success).toBe(false)
      expect(result.delivered).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should respect timeout option', async () => {
      const { withIdempotency } = await import('@/lib/idempotency')
      vi.mocked(withIdempotency).mockImplementation(async (key, fn) => {
        return fn()
      })

      mockFetch.mockImplementationOnce(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              text: async () => 'OK',
              headers: new Headers(),
            } as Response)
          }, 100)
        })
      })

      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await deliverWebhook('event-123', mockWebhook, mockPayload, {
        timeout: 200, // 200ms timeout
      })

      expect(result.delivered).toBe(true)
    })
  })

  describe('createEventLog', () => {
    it('should create event log entry', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'event-log-123' }],
      })

      const eventLogId = await createEventLog(
        'project-123',
        'webhook-123',
        'project.created',
        mockPayload
      )

      expect(eventLogId).toBe('event-log-123')
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.event_log'),
        expect.arrayContaining(['project-123', 'webhook-123', 'project.created'])
      )
    })

    it('should set initial status to pending', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'event-log-123' }],
      })

      await createEventLog('project-123', 'webhook-123', 'project.created', mockPayload)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.arrayContaining(expect.anything())
      )
    })

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'))

      await expect(
        createEventLog('project-123', 'webhook-123', 'project.created', mockPayload)
      ).rejects.toThrow()
    })
  })

  describe('findWebhooksForEvent', () => {
    it('should find enabled webhooks for event', async () => {
      const webhooks = [mockWebhook]
      mockPool.query.mockResolvedValueOnce({ rows: webhooks })

      const result = await findWebhooksForEvent('project-123', 'project.created')

      expect(result).toHaveLength(1)
      expect(result[0].event).toBe('project.created')
      expect(result[0].enabled).toBe(true)
    })

    it('should only return enabled webhooks', async () => {
      const webhooks = [mockWebhook]
      mockPool.query.mockResolvedValueOnce({ rows: webhooks })

      await findWebhooksForEvent('project-123', 'project.created')

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('enabled = true'),
        expect.any(Array)
      )
    })

    it('should return empty array when no webhooks found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await findWebhooksForEvent('project-123', 'project.created')

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'))

      const result = await findWebhooksForEvent('project-123', 'project.created')

      expect(result).toEqual([])
    })
  })

  describe('emitEvent', () => {
    it('should emit event to all registered webhooks', async () => {
      const webhooks = [mockWebhook]
      mockPool.query.mockResolvedValueOnce({ rows: webhooks })

      // Mock createEventLog
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'event-log-123' }] })

      // Mock idempotency
      const { withIdempotency } = await import('@/lib/idempotency')
      vi.mocked(withIdempotency).mockImplementation(async (key, fn) => {
        return fn()
      })

      // Mock successful delivery
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'OK',
        headers: new Headers(),
      })

      // Mock event log update
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const results = await emitEvent('project-123', 'project.created', mockPayload)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
    })

    it('should return empty array when no webhooks registered', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const results = await emitEvent('project-123', 'project.created', mockPayload)

      expect(results).toEqual([])
    })

    it('should handle individual webhook failures gracefully', async () => {
      const webhooks = [mockWebhook]
      mockPool.query.mockResolvedValueOnce({ rows: webhooks })

      // Mock createEventLog
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'event-log-123' }] })

      // Mock idempotency
      const { withIdempotency } = await import('@/lib/idempotency')
      vi.mocked(withIdempotency).mockImplementation(async (key, fn) => {
        return fn()
      })

      // Mock failed delivery
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Mock event log update
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const results = await emitEvent('project-123', 'project.created', mockPayload)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(false)
    })
  })

  describe('emitPlatformEvent', () => {
    it('should create platform event log entry', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'platform-event-123' }],
      })

      const eventLogId = await emitPlatformEvent('user.signedup', {
        user_id: 'user-123',
        email: 'test@example.com',
      })

      expect(eventLogId).toBe('platform-event-123')
    })

    it('should use system project ID for platform events', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'platform-event-123' }],
      })

      await emitPlatformEvent('user.signedup', { user_id: 'user-123' })

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.event_log'),
        expect.arrayContaining(['00000000-0000-0000-0000-000000000000'])
      )
    })

    it('should set status to delivered for platform events', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'platform-event-123' }],
      })

      await emitPlatformEvent('user.signedup', { user_id: 'user-123' })

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("'delivered'"),
        expect.any(Array)
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'))

      const eventLogId = await emitPlatformEvent('user.signedup', { user_id: 'user-123' })

      expect(eventLogId).toBeNull()
    })
  })
})
