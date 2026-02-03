/**
 * Audit Logger Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  logAuditEntry,
  getAuditLogsByRequestId,
  logAuditFromRequest,
} from '../core'
import {
  sanitizeAuditMetadata,
  redactSecretPatterns,
} from '../sanitization'
import {
  extractRequestId,
  extractIpAddress,
  extractUserAgent,
} from '../request-extractors'
import { getPool } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

vi.mock('@/lib/middleware/correlation', () => ({
  extractCorrelationId: vi.fn(() => 'test-correlation-id'),
  generateCorrelationId: vi.fn(() => 'generated-id'),
}))

describe('audit-logger-module', () => {
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

  describe('core - logAuditEntry', () => {
    const mockAuditEntry = {
      actor_id: 'user-123',
      actor_type: 'user' as const,
      action: 'api_key.create',
      target_type: 'api_key' as const,
      target_id: 'key-123',
      metadata: { key_name: 'Test Key' },
      ip_address: '127.0.0.1',
      user_agent: 'TestAgent/1.0',
      request_id: 'req-123',
      project_id: 'proj-123',
    }

    it('should log audit entry successfully', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'audit-123' }],
      })

      const auditLogId = await logAuditEntry(mockAuditEntry)

      expect(auditLogId).toBe('audit-123')
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.audit_logs'),
        expect.arrayContaining([
          'user-123',
          'user',
          'api_key.create',
          'api_key',
          'key-123',
          expect.any(String),
          '127.0.0.1',
          'TestAgent/1.0',
          'req-123',
          'proj-123',
        ])
      )
    })

    it('should handle audit entry without optional fields', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'audit-456' }],
      })

      const minimalEntry = {
        actor_id: 'user-456',
        actor_type: 'user' as const,
        action: 'project.create',
        target_type: 'project' as const,
        target_id: 'proj-456',
      }

      const auditLogId = await logAuditEntry(minimalEntry)

      expect(auditLogId).toBe('audit-456')
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.audit_logs'),
        expect.arrayContaining([
          'user-456',
          'project.create',
          'project',
          'proj-456',
          null,
          null,
          null,
          null,
        ])
      )
    })

    it('should log to console with sanitized metadata', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'audit-789' }],
      })

      await logAuditEntry({
        ...mockAuditEntry,
        metadata: { password: 'secret123', key_name: 'Test Key' },
      })

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('user:user-123 -> api_key.create on api_key:key-123'),
        expect.objectContaining({
          auditLogId: 'audit-789',
          metadata: expect.not.objectContaining({ password: expect.anything() }),
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      await expect(logAuditEntry(mockAuditEntry)).rejects.toThrow('Database connection failed')
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('core - getAuditLogsByRequestId', () => {
    it('should query audit logs by request ID', async () => {
      const mockLogs = [
        {
          id: 'audit-1',
          actor_id: 'user-123',
          actor_type: 'user',
          action: 'api_key.create',
          target_type: 'api_key',
          target_id: 'key-123',
          metadata: {},
          ip_address: '127.0.0.1',
          user_agent: 'TestAgent',
          request_id: 'req-123',
          project_id: 'proj-123',
          created_at: new Date(),
        },
      ]

      mockPool.query.mockResolvedValueOnce({ rows: mockLogs })

      const result = await getAuditLogsByRequestId('req-123')

      expect(result).toEqual(mockLogs)
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, actor_id, actor_type'),
        ['req-123']
      )
    })

    it('should query audit logs by request ID and project ID', async () => {
      const mockLogs = []

      mockPool.query.mockResolvedValueOnce({ rows: mockLogs })

      const result = await getAuditLogsByRequestId('req-123', 'proj-123')

      expect(result).toEqual([])
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('project_id = $2'),
        ['req-123', 'proj-123']
      )
    })

    it('should handle query errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Query failed'))

      await expect(getAuditLogsByRequestId('req-123')).rejects.toThrow('Query failed')
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('core - logAuditFromRequest', () => {
    it('should log audit entry extracting data from request', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'audit-999' }],
      })

      const request = {
        headers: {
          get: vi.fn((name: string) => {
            const headers: Record<string, string> = {
              'x-forwarded-for': '192.168.1.1',
              'user-agent': 'Mozilla/5.0',
              'x-request-id': 'req-999',
            }
            return headers[name] || null
          }),
        },
      } as unknown as NextRequest

      const auditLogId = await logAuditFromRequest(request, {
        actor_id: 'user-999',
        actor_type: 'user',
        action: 'project.update',
        target_type: 'project',
        target_id: 'proj-999',
      })

      expect(auditLogId).toBe('audit-999')
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.audit_logs'),
        expect.arrayContaining([
          'user-999',
          '192.168.1.1',
          'Mozilla/5.0',
          'req-999',
        ])
      )
    })
  })

  describe('sanitization - sanitizeAuditMetadata', () => {
    it('should remove sensitive keys from metadata', () => {
      const metadata = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com',
        api_key: 'key-abc-123',
      }

      const sanitized = sanitizeAuditMetadata(metadata)

      expect(sanitized).toEqual({
        username: 'testuser',
        email: 'test@example.com',
      })
      expect(sanitized).not.toHaveProperty('password')
      expect(sanitized).not.toHaveProperty('api_key')
    })

    it('should handle nested objects', () => {
      const metadata = {
        user: {
          username: 'testuser',
          password: 'secret123',
          profile: {
            token: 'hidden-token',
            bio: 'Test bio',
          },
        },
      }

      const sanitized = sanitizeAuditMetadata(metadata)

      expect(sanitized).toEqual({
        user: {
          username: 'testuser',
          profile: {
            bio: 'Test bio',
          },
        },
      })
    })

    it('should handle arrays of objects', () => {
      const metadata = {
        items: [
          { name: 'item1', secret: 'value1' },
          { name: 'item2', token: 'value2' },
        ],
      }

      const sanitized = sanitizeAuditMetadata(metadata)

      expect(sanitized).toEqual({
        items: [
          { name: 'item1' },
          { name: 'item2' },
        ],
      })
    })

    it('should return empty object for undefined metadata', () => {
      const sanitized = sanitizeAuditMetadata(undefined)
      expect(sanitized).toEqual({})
    })

    it('should handle empty object', () => {
      const sanitized = sanitizeAuditMetadata({})
      expect(sanitized).toEqual({})
    })
  })

  describe('sanitization - redactSecretPatterns', () => {
    it('should redact password patterns', () => {
      const message = 'Error: password=mysecret123 failed'
      const redacted = redactSecretPatterns(message)

      expect(redacted).toBe('Error: password=[REDACTED] failed')
    })

    it('should redact token patterns', () => {
      const message = 'Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const redacted = redactSecretPatterns(message)

      expect(redacted).toContain('Authorization: bearer [REDACTED]')
    })

    it('should redact api_key patterns', () => {
      const message = 'API key: key_abc123def456'
      const redacted = redactSecretPatterns(message)

      expect(redacted).toContain('API key: key_[REDACTED]')
    })

    it('should redact JSON-like secret patterns', () => {
      const message = '"password":"mysecret123"'
      const redacted = redactSecretPatterns(message)

      expect(redacted).toBe('"password":"[REDACTED]"')
    })

    it('should handle multiple patterns in one message', () => {
      const message = 'password=secret123, token=abc456'
      const redacted = redactSecretPatterns(message)

      expect(redacted).toBe('password=[REDACTED], token=[REDACTED]')
    })

    it('should not modify strings without secrets', () => {
      const message = 'User john.doe performed action create_project'
      const redacted = redactSecretPatterns(message)

      expect(redacted).toBe(message)
    })
  })

  describe('request-extractors - extractRequestId', () => {
    it('should extract correlation ID from request', () => {
      const { extractCorrelationId } = require('@/lib/middleware/correlation')

      vi.mocked(extractCorrelationId).mockReturnValue('test-req-id')

      const request = {
        headers: {
          get: vi.fn(() => 'test-req-id'),
        },
      } as unknown as NextRequest

      const requestId = extractRequestId(request)

      expect(requestId).toBe('test-req-id')
      expect(extractCorrelationId).toHaveBeenCalledWith(request)
    })
  })

  describe('request-extractors - extractIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = {
        headers: {
          get: vi.fn((name) => (name === 'x-forwarded-for' ? '192.168.1.1, 10.0.0.1' : null)),
        },
      } as unknown as NextRequest

      const ip = extractIpAddress(request)

      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from cf-connecting-ip header', () => {
      const request = {
        headers: {
          get: vi.fn((name) => (name === 'cf-connecting-ip' ? '203.0.113.1' : null)),
        },
      } as unknown as NextRequest

      const ip = extractIpAddress(request)

      expect(ip).toBe('203.0.113.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = {
        headers: {
          get: vi.fn((name) => (name === 'x-real-ip' ? '198.51.100.1' : null)),
        },
      } as unknown as NextRequest

      const ip = extractIpAddress(request)

      expect(ip).toBe('198.51.100.1')
    })

    it('should return fallback IP when no headers present', () => {
      const request = {
        headers: {
          get: vi.fn(() => null),
        },
      } as unknown as NextRequest

      const ip = extractIpAddress(request)

      expect(ip).toBe('0.0.0.0')
    })

    it('should prioritize x-forwarded-for over other headers', () => {
      const request = {
        headers: {
          get: vi.fn((name) => {
            const headers: Record<string, string> = {
              'x-forwarded-for': '192.168.1.1',
              'cf-connecting-ip': '203.0.113.1',
              'x-real-ip': '198.51.100.1',
            }
            return headers[name] || null
          }),
        },
      } as unknown as NextRequest

      const ip = extractIpAddress(request)

      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('request-extractors - extractUserAgent', () => {
    it('should extract user agent from request', () => {
      const request = {
        headers: {
          get: vi.fn((name) => (name === 'user-agent' ? 'Mozilla/5.0' : null)),
        },
      } as unknown as NextRequest

      const userAgent = extractUserAgent(request)

      expect(userAgent).toBe('Mozilla/5.0')
    })

    it('should return Unknown when no user agent header', () => {
      const request = {
        headers: {
          get: vi.fn(() => null),
        },
      } as unknown as NextRequest

      const userAgent = extractUserAgent(request)

      expect(userAgent).toBe('Unknown')
    })
  })
})
