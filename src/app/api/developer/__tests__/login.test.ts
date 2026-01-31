/**
 * Tests for developer login API route
 *
 * Tests credential validation, JWT generation, and project verification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { getPool } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/db')
vi.mock('@/lib/auth')
vi.mock('@/lib/usage/auth-tracking')

const mockPool = {
  query: vi.fn(),
}

vi.mocked(getPool).mockReturnValue(mockPool as never)

describe('POST /api/developer/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(generateAccessToken).mockReturnValue('mock-access-token')
    vi.mocked(generateRefreshToken).mockReturnValue('mock-refresh-token')
  })

  const createMockRequest = (body: unknown) => {
    return {
      json: async () => body,
      headers: new Headers(),
    } as unknown as Request
  }

  const mockDeveloper = {
    id: 'dev-123',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    name: 'Test Developer',
    organization: 'Test Org',
    status: 'active',
  }

  it('should require email and password', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      // password missing
      project_id: 'project-123',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })

  it('should require project_id', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      // project_id missing
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('project_id is required')
  })

  it('should reject non-existent email', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] })

    const request = createMockRequest({
      email: 'nonexistent@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid credentials')
  })

  it('should reject inactive developer', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ...mockDeveloper, status: 'suspended' }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid credentials')
  })

  it('should reject incorrect password', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'wrongpassword',
      project_id: 'project-123',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid credentials')
  })

  it('should reject project that does not exist', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    mockPool.query.mockResolvedValueOnce({ rows: [] })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'nonexistent-project',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('Invalid project_id')
  })

  it('should reject project that belongs to different developer', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'project-456', developer_id: 'different-dev-id' }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-456',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('access denied')
  })

  it('should login successfully with valid credentials', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'project-123', developer_id: 'dev-123' }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.developer).toHaveProperty('id')
    expect(data.developer).toHaveProperty('email')
    expect(data.developer).toHaveProperty('name')
    expect(data.accessToken).toBe('mock-access-token')
    expect(data.refreshToken).toBe('mock-refresh-token')
  })

  it('should generate JWT with project_id', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'project-123', developer_id: 'dev-123' }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    await POST(request as Request)

    expect(generateAccessToken).toHaveBeenCalledWith(
      mockDeveloper,
      'project-123'
    )
  })

  it('should generate refresh token', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'project-123', developer_id: 'dev-123' }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    await POST(request as Request)

    expect(generateRefreshToken).toHaveBeenCalledWith('dev-123')
  })

  it('should return developer information without sensitive data', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'project-123', developer_id: 'dev-123' }],
    })

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(data.developer).not.toHaveProperty('password_hash')
    expect(data.developer).not.toHaveProperty('status')
    expect(data.developer.id).toBe('dev-123')
    expect(data.developer.email).toBe('test@example.com')
  })

  it('should track signin usage', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockDeveloper] })
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'project-123', developer_id: 'dev-123' }],
    })

    const { trackAuthSignin } = await import('@/lib/usage/auth-tracking')
    vi.mocked(trackAuthSignin).mockResolvedValue(undefined)

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    await POST(request as Request)

    expect(trackAuthSignin).toHaveBeenCalledWith('project-123')
  })

  it('should handle database errors gracefully', async () => {
    mockPool.query.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      project_id: 'project-123',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })
})
