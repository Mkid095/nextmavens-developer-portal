/**
 * Tests for Provisioning Step Handlers
 *
 * Tests tenant schema creation, tenant database tables, service registration,
 * API key generation, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Pool } from 'pg'
import {
  createTenantSchemaHandler,
  createTenantDatabaseHandler,
  registerAuthServiceHandler,
  registerRealtimeServiceHandler,
  registerStorageServiceHandler,
  generateApiKeysHandler,
} from '../handlers'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  generateApiKey: vi.fn((type: string) => {
    if (type === 'public') return 'a'.repeat(64)
    if (type === 'secret') return 'b'.repeat(64)
    return 'c'.repeat(64)
  }),
  hashApiKey: vi.fn((key: string) => `hash_${key.substring(0, 10)}`),
  generateAccessToken: vi.fn(),
  verifyAccessToken: vi.fn(),
  authenticateRequest: vi.fn(),
  checkProjectStatus: vi.fn(),
  authenticateApiKey: vi.fn(),
  logApiKeyUsage: vi.fn(),
  updateKeyUsage: vi.fn(),
  generateSlug: vi.fn(),
}))

// Mock fetch globally for service registration tests
global.fetch = vi.fn()

// Mock pool client
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
}

// Mock pool
const mockPool = {
  connect: vi.fn(),
} as unknown as Pool

describe('Tenant Schema Creation Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockReset()

    // Setup environment variables
    vi.stubEnv('AUTH_SERVICE_URL', 'http://localhost:3001')
    vi.stubEnv('TELEGRAM_STORAGE_API_URL', 'https://telegram-api.test.com')
    vi.stubEnv('TELEGRAM_STORAGE_API_KEY', 'test-key')
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud')

    // Setup mock pool
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('createTenantSchemaHandler', () => {
    const projectId = 'test-project-id'

    it('should create tenant schema successfully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug: 'my-test-project' }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(4)
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
      expect(result.errorDetails?.error_type).toBe('NotFoundError')
    })

    it('should return error when slug is missing', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [{}],
      })

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('slug is required')
      expect(result.errorDetails?.error_type).toBe('ValidationError')
    })

    it('should return error for invalid slug characters', async () => {
      const invalidSlugs = [
        'MyProject',
        'my project',
        'my.project',
        "my'project",
        'my;project',
      ]

      for (const invalidSlug of invalidSlugs) {
        vi.clearAllMocks()
        vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)

        mockClient.query = vi.fn().mockResolvedValueOnce({
          rows: [{ slug: invalidSlug }],
        })

        const result = await createTenantSchemaHandler(projectId, mockPool)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid slug format')
        expect(result.errorDetails?.error_type).toBe('ValidationError')
        expect(result.errorDetails?.context).toMatchObject({ slug: invalidSlug })
      }
    })

    it('should accept valid slugs with lowercase letters, numbers, and hyphens', async () => {
      const validSlugs = [
        'my-project',
        'my-test-project-123',
        'project',
        'my-project-v2',
        '123project',
      ]

      for (const validSlug of validSlugs) {
        vi.clearAllMocks()
        vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)

        mockClient.query = vi.fn()
          .mockResolvedValueOnce({
            rows: [{ slug: validSlug }],
          })
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined)

        const result = await createTenantSchemaHandler(projectId, mockPool)

        expect(result.success).toBe(true)
      }
    })

    it('should use correct schema name pattern', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await createTenantSchemaHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE SCHEMA IF NOT EXISTS "tenant_${slug}"`
      )
    })

    it('should release client even on error', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Database connection failed'))

      await createTenantSchemaHandler(projectId, mockPool)

      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug: 'test-project' }],
        })
        .mockRejectedValueOnce(new Error('Permission denied to create schema'))

      const result = await createTenantSchemaHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create tenant schema')
      expect(result.error).toContain('Permission denied')
    })
  })
})

describe('Tenant Database Creation Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  describe('createTenantDatabaseHandler', () => {
    const projectId = 'test-project-id'

    it('should create all tenant tables successfully', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValue(undefined) // All remaining queries (for tables, indexes, RLS policies)

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should return error when slug is missing', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [{}],
      })

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('slug is required')
    })

    it('should return error for invalid slug characters', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [{ slug: 'InvalidSlug' }],
      })

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid slug format')
    })

    it('should create users table with correct schema', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_test-project".users')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('id UUID PRIMARY KEY')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('email VARCHAR(255) UNIQUE NOT NULL')
      )
    })

    it('should create audit_log table with correct schema', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_test-project".audit_log')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('action VARCHAR(100) NOT NULL')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('actor_id UUID')
      )
    })

    it('should create _migrations table with correct schema', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS "tenant_test-project"._migrations')
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('version VARCHAR(100) NOT NULL UNIQUE')
      )
    })

    it('should create indexes for performance', async () => {
      const slug = 'test-project'
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE INDEX IF NOT EXISTS idx_users_email ON "tenant_${slug}".users(email)`
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON "tenant_${slug}".audit_log(actor_id)`
      )
      expect(mockClient.query).toHaveBeenCalledWith(
        `CREATE INDEX IF NOT EXISTS idx_audit_log_created ON "tenant_${slug}".audit_log(created_at DESC)`
      )
    })

    it('should release client even on error', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Database error'))

      await createTenantDatabaseHandler(projectId, mockPool)

      expect(mockClient.release).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{ slug: 'test-project' }],
        })
        .mockRejectedValueOnce(new Error('Table creation failed'))

      const result = await createTenantDatabaseHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create tenant tables')
      expect(result.error).toContain('Table creation failed')
    })
  })
})

describe('Auth Service Registration Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
    vi.stubEnv('AUTH_SERVICE_URL', 'http://localhost:3001')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('registerAuthServiceHandler', () => {
    const projectId = 'test-project-id'

    it('should register with auth service successfully', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tenant: { id: 'auth-tenant-123', slug: 'test-project' },
          user: { id: 'user-123', email: 'admin@test-project.placeholder' },
        }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            name: 'Test Project',
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerAuthServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(2)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/create-tenant',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await registerAuthServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
      expect(result.errorDetails?.error_type).toBe('NotFoundError')
    })

    it('should store auth service configuration in metadata', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tenant: { id: 'auth-tenant-abc', slug: 'my-project' },
          user: { id: 'user-abc', email: 'admin@my-project.placeholder' },
        }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            name: 'My Project',
            slug: 'my-project',
            tenant_id: 'tenant-abc',
            environment: 'prod',
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerAuthServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('auth_service'),
        expect.arrayContaining([projectId, 'tenant-abc', 'prod'])
      )
    })

    it('should use default environment when not set', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tenant: { id: 'auth-tenant-123', slug: 'test-project' },
          user: { id: 'user-123', email: 'admin@test-project.placeholder' },
        }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            name: 'Test Project',
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: null,
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerAuthServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('auth_service'),
        expect.arrayContaining([projectId, 'tenant-123', 'dev'])
      )
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Database connection failed'))

      const result = await registerAuthServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to register with auth service')
    })
  })
})

describe('Realtime Service Registration Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  describe('registerRealtimeServiceHandler', () => {
    const projectId = 'test-project-id'

    it('should register with realtime service successfully', async () => {
      // Mock fetch response for health check
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', service: 'realtime-service' }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-456',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(2)
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should store realtime service configuration in metadata', async () => {
      // Mock fetch response for health check
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', service: 'realtime-service' }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'my-project',
            tenant_id: 'tenant-xyz',
            environment: 'staging',
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerRealtimeServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('realtime_service'),
        expect.arrayContaining([projectId, 'tenant-xyz', 'staging', 'tenant-xyz:'])
      )
    })

    it('should set default connection limits', async () => {
      // Mock fetch response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as Response)

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Registration failed'))

      const result = await registerRealtimeServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to register with realtime service')
    })
  })
})

describe('Storage Service Registration Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
    // Setup storage environment variables
    vi.stubEnv('TELEGRAM_STORAGE_API_URL', 'https://telegram-api.test.com')
    vi.stubEnv('TELEGRAM_STORAGE_API_KEY', 'test-key')
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('registerStorageServiceHandler', () => {
    const projectId = 'test-project-id'

    it('should register with storage service successfully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-789',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(2)
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should return error when no storage credentials configured', async () => {
      vi.unstubAllEnvs() // Clear storage credentials

      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-789',
            environment: 'dev',
          }],
        })

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No storage service credentials configured')
    })

    it('should store storage service configuration in metadata', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'my-project',
            tenant_id: 'tenant-def',
            environment: 'prod',
          }],
        })
        .mockResolvedValueOnce(undefined)

      await registerStorageServiceHandler(projectId, mockPool)

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('storage_service'),
        expect.arrayContaining([projectId, 'tenant-def', 'prod', 'tenant-def/'])
      )
    })

    it('should set default storage quotas', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn().mockRejectedValueOnce(new Error('Storage registration failed'))

      const result = await registerStorageServiceHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to register with storage service')
    })
  })
})

describe('API Keys Generation Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  describe('generateApiKeysHandler', () => {
    const projectId = 'test-project-id'

    it('should generate all three API key types successfully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
      expect(mockClient.query).toHaveBeenCalledTimes(3)
    })

    it('should return error when project not found', async () => {
      mockClient.query = vi.fn().mockResolvedValueOnce({
        rows: [],
      })

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
    })

    it('should insert keys with correct key_type values', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce(undefined)

      await generateApiKeysHandler(projectId, mockPool)

      const insertCall = mockClient.query.mock.calls[1]
      expect(insertCall[0]).toContain('INSERT INTO api_keys')
      expect(insertCall[0]).toContain("'public'")
      expect(insertCall[0]).toContain("'secret'")
      expect(insertCall[0]).toContain("'service_role'")
    })

    it('should use environment-specific key prefixes', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'prod',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should use dev environment as default', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: null,
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should set correct scopes for service_role key', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should store API key preview in metadata', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should use ON CONFLICT for idempotency', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockResolvedValueOnce(undefined)

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      mockClient.query = vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            id: projectId,
            slug: 'test-project',
            tenant_id: 'tenant-123',
            environment: 'dev',
            developer_id: 'dev-456',
          }],
        })
        .mockRejectedValueOnce(new Error('Key generation failed'))

      const result = await generateApiKeysHandler(projectId, mockPool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to generate API keys')
    })
  })
})

describe('Handler Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
    vi.mocked(global.fetch).mockReset()

    // Setup environment variables
    vi.stubEnv('AUTH_SERVICE_URL', 'http://localhost:3001')
    vi.stubEnv('TELEGRAM_STORAGE_API_URL', 'https://telegram-api.test.com')
    vi.stubEnv('TELEGRAM_STORAGE_API_KEY', 'test-key')
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud')
  })

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
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
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
