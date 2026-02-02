/**
 * Integration Tests for Provisioning Handlers
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createTenantSchemaHandler,
  registerAuthServiceHandler,
  registerRealtimeServiceHandler,
  registerStorageServiceHandler,
  generateApiKeysHandler,
} from '../handlers'
import { mockClient, mockPool, setupCommonTestEnvironment } from './test-setup'

describe('Handler Integration', () => {
  setupCommonTestEnvironment()

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should use IF NOT EXISTS for idempotency', async () => {
    const slug = 'test-project'
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ slug }],
      })
      .mockResolvedValueOnce(undefined)

    await createTenantSchemaHandler('project-id', mockPool)

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('IF NOT EXISTS')
    )
  })

  it('should handle special characters in slug safely', async () => {
    const dangerousSlug = "'; DROP TABLE users; --"
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ slug: dangerousSlug }],
      })

    const result = await createTenantSchemaHandler('project-id', mockPool)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid slug format')
  })

  it('should complete all service registrations in sequence', async () => {
    const projectId = 'integration-test-project'

    // Run handlers sequentially to avoid mock conflicts
    const results = []

    // Mock fetch for auth service
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tenant: { id: 'auth-tenant-1', slug: 'test' },
        user: { id: 'user-1', email: 'admin@test.placeholder' },
      }),
    } as Response)

    // Auth service
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ id: projectId, name: 'Test', slug: 'test', tenant_id: 't1', environment: 'dev' }],
      })
      .mockResolvedValueOnce(undefined)
    results.push(await registerAuthServiceHandler(projectId, mockPool))

    // Mock fetch for realtime service
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response)

    // Realtime service
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ id: projectId, slug: 'test', tenant_id: 't1', environment: 'dev' }],
      })
      .mockResolvedValueOnce(undefined)
    results.push(await registerRealtimeServiceHandler(projectId, mockPool))

    // Storage service
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ id: projectId, slug: 'test', tenant_id: 't1', environment: 'dev' }],
      })
      .mockResolvedValueOnce(undefined)
    results.push(await registerStorageServiceHandler(projectId, mockPool))

    // API keys
    mockClient.query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ id: projectId, slug: 'test', tenant_id: 't1', environment: 'dev', developer_id: 'd1' }],
      })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No existing keys
      .mockResolvedValueOnce(undefined) // Insert keys
      .mockResolvedValueOnce(undefined) // Update metadata
    results.push(await generateApiKeysHandler(projectId, mockPool))

    // Each handler should succeed
    results.forEach(result => {
      expect(result.success).toBe(true)
    })
  })

  it('should handle consistent project data across all handlers', async () => {
    const projectId = 'consistency-test'
    const projectData = {
      id: projectId,
      name: 'My Project',
      slug: 'my-project',
      tenant_id: 'tenant-consistent',
      environment: 'staging' as const,
      developer_id: 'dev-consistent',
    }

    // Run handlers sequentially and verify they all succeed
    const results = []

    // Mock fetch for auth service
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tenant: { id: 'auth-tenant-2', slug: 'my-project' },
        user: { id: 'user-2', email: 'admin@my-project.placeholder' },
      }),
    } as Response)

    mockClient.query = vi.fn()
      .mockResolvedValueOnce({ rows: [projectData] })
      .mockResolvedValueOnce(undefined)
    results.push(await registerAuthServiceHandler(projectId, mockPool))

    // Mock fetch for realtime service
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response)

    mockClient.query = vi.fn()
      .mockResolvedValueOnce({ rows: [projectData] })
      .mockResolvedValueOnce(undefined)
    results.push(await registerRealtimeServiceHandler(projectId, mockPool))

    mockClient.query = vi.fn()
      .mockResolvedValueOnce({ rows: [projectData] })
      .mockResolvedValueOnce(undefined)
    results.push(await registerStorageServiceHandler(projectId, mockPool))

    // All handlers should succeed
    results.forEach(result => {
      expect(result.success).toBe(true)
    })
  })
})
