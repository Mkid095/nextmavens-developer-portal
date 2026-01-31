/**
 * Tests for projects API route
 *
 * Tests project creation, validation, and listing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET } from './route'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/db')
vi.mock('@/lib/auth')

const mockPool = {
  query: vi.fn(),
}

vi.mocked(getPool).mockReturnValue(mockPool as never)

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authenticateRequest).mockResolvedValue({
      id: 'dev-123',
      email: 'test@example.com',
      project_id: 'current-project',
    })
  })

  const createMockRequest = (body: unknown) => {
    return {
      json: async () => body,
      headers: new Headers({
        authorization: 'Bearer mock-token',
      }),
    } as unknown as Request
  }

  it('should require authentication', async () => {
    vi.mocked(authenticateRequest).mockRejectedValue(
      new Error('Unauthorized')
    )

    const request = createMockRequest({
      name: 'Test Project',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(401)
  })

  it('should require project name', async () => {
    const request = createMockRequest({
      // name missing
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('name')
  })

  it('should create project successfully', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'project-123',
        developer_id: 'dev-123',
        name: 'Test Project',
        slug: 'test-project',
        status: 'active',
        created_at: new Date(),
      }],
    })

    const request = createMockRequest({
      name: 'Test Project',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.project).toHaveProperty('id')
    expect(data.project.name).toBe('Test Project')
  })

  it('should generate slug from project name', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'project-123',
        developer_id: 'dev-123',
        name: 'My Awesome Project!',
        slug: 'my-awesome-project',
        status: 'active',
        created_at: new Date(),
      }],
    })

    const request = createMockRequest({
      name: 'My Awesome Project!',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(data.project.slug).toBe('my-awesome-project')
  })

  it('should handle duplicate slug', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'project-123',
          developer_id: 'dev-123',
          name: 'Test Project',
          slug: 'test-project',
          status: 'active',
          created_at: new Date(),
        }],
      })
      .mockRejectedValueOnce(new Error('duplicate key value'))

    const request = createMockRequest({
      name: 'Test Project',
    })

    const response = await POST(request as Request)

    expect(response.status).toBe(409)
  })

  it('should reject empty project name', async () => {
    const request = createMockRequest({
      name: '',
    })

    const response = await POST(request as Request)
    const data = await response.json()

    expect(response.status).toBe(400)
  })

  it('should handle database errors', async () => {
    mockPool.query.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest({
      name: 'Test Project',
    })

    const response = await POST(request as Request)

    expect(response.status).toBe(500)
  })
})

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authenticateRequest).mockResolvedValue({
      id: 'dev-123',
      email: 'test@example.com',
      project_id: 'current-project',
    })
  })

  const createMockRequest = () => {
    return {
      headers: new Headers({
        authorization: 'Bearer mock-token',
      }),
    } as unknown as Request
  }

  it('should require authentication', async () => {
    vi.mocked(authenticateRequest).mockRejectedValue(
      new Error('Unauthorized')
    )

    const request = createMockRequest()

    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should list projects for authenticated developer', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        developer_id: 'dev-123',
        name: 'Project 1',
        slug: 'project-1',
        status: 'active',
        created_at: new Date(),
      },
      {
        id: 'project-2',
        developer_id: 'dev-123',
        name: 'Project 2',
        slug: 'project-2',
        status: 'active',
        created_at: new Date(),
      },
    ]

    mockPool.query.mockResolvedValueOnce({ rows: mockProjects })

    const request = createMockRequest()

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.projects).toHaveLength(2)
    expect(data.projects[0].name).toBe('Project 1')
  })

  it('should return empty array when no projects', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] })

    const request = createMockRequest()

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.projects).toEqual([])
  })

  it('should only return projects for authenticated developer', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'project-1',
          developer_id: 'dev-123',
          name: 'Project 1',
          slug: 'project-1',
          status: 'active',
          created_at: new Date(),
        },
      ],
    })

    const request = createMockRequest()

    await GET(request)

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('developer_id = $1'),
      expect.arrayContaining(['dev-123'])
    )
  })

  it('should handle database errors', async () => {
    mockPool.query.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest()

    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
