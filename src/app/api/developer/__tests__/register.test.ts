/**
 * Tests for developer registration API route
 *
 * Tests validation, rate limiting, and registration flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { getPool } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('@/lib/db')
vi.mock('@/lib/features')
vi.mock('@/features/abuse-controls/lib/rate-limiter')
vi.mock('@/lib/usage/auth-tracking')
vi.mock('@/features/webhooks')

const mockPool = {
  query: vi.fn(),
}

vi.mocked(getPool).mockReturnValue(mockPool as never)

describe('POST /api/developer/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
  })

  const createMockRequest = (body: unknown) => {
    return {
      json: async () => body,
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
      }),
    } as unknown as Request
  }

  const createMockResponse = () => {
    const json = vi.fn()
    const status = vi.fn(() => ({ json, headers: vi.fn(() => ({ json })) }))
    return { json, status }
  }

  it('should require email, password, and name', async () => {
    // Mock feature flag
    vi.doMock('@/lib/features', () => ({
      checkFeature: vi.fn().mockResolvedValue(true),
    }))

    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(true)

    // Mock rate limit check
    const { checkRateLimit } = await import('@/features/abuse-controls/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remainingAttempts: 5,
      resetAt: new Date(Date.now() + 3600000),
    })

    const request = createMockRequest({ email: 'test@example.com' }) // Missing password and name

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })

  it('should require password minimum length of 8 characters', async () => {
    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(true)

    const { checkRateLimit } = await import('@/features/abuse-controls/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remainingAttempts: 5,
      resetAt: new Date(Date.now() + 3600000),
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('at least 8 characters')
  })

  it('should reject duplicate email', async () => {
    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(true)

    const { checkRateLimit } = await import('@/features/abuse-controls/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remainingAttempts: 5,
      resetAt: new Date(Date.now() + 3600000),
    })

    // Mock existing developer
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'existing-id' }],
    })

    const request = createMockRequest({
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test User',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain('already registered')
  })

  it('should create developer successfully', async () => {
    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(true)

    const { checkRateLimit } = await import('@/features/abuse-controls/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remainingAttempts: 5,
      resetAt: new Date(Date.now() + 3600000),
    })

    // Mock no existing developer
    mockPool.query.mockResolvedValueOnce({ rows: [] })

    // Mock successful insert
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'new-dev-id',
        email: 'test@example.com',
        name: 'Test User',
        organization: 'Test Org',
        created_at: new Date(),
      }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      organization: 'Test Org',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.developer).toHaveProperty('id')
    expect(data.developer).toHaveProperty('email')
    expect(data.developer.email).toBe('test@example.com')
  })

  it('should enforce IP-based rate limiting', async () => {
    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(true)

    // Mock rate limit exceeded
    const { checkRateLimit } = await import('@/features/abuse-controls/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
      resetAt: new Date(Date.now() + 3600000),
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Rate limit exceeded')
  })

  it('should return 503 when signups are disabled', async () => {
    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(false)

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toContain('Signups disabled')
  })

  it('should hash password before storing', async () => {
    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(true)

    const { checkRateLimit } = await import('@/features/abuse-controls/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remainingAttempts: 5,
      resetAt: new Date(Date.now() + 3600000),
    })

    mockPool.query.mockResolvedValueOnce({ rows: [] })
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'new-dev-id',
        email: 'test@example.com',
        name: 'Test User',
        created_at: new Date(),
      }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })

    await POST(request as Request)

    // Verify bcrypt.hash was called
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)

    // Verify the insert query was called with hashed password
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO developers'),
      expect.arrayContaining(['test@example.com', expect.stringContaining('hashed')])
    )
  })

  it('should handle database errors gracefully', async () => {
    const { checkFeature } = await import('@/lib/features')
    vi.mocked(checkFeature).mockResolvedValue(true)

    const { checkRateLimit } = await import('@/features/abuse-controls/lib/rate-limiter')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remainingAttempts: 5,
      resetAt: new Date(Date.now() + 3600000),
    })

    // Mock database error
    mockPool.query.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })
})
