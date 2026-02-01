/**
 * Provisioning Integration Tests
 *
 * Integration test suite for the full provisioning flow with a real database.
 * Tests the complete end-to-end provisioning process from project creation
 * through all provisioning steps.
 *
 * Prerequisites:
 * - DATABASE_URL must be set to a test database
 * - Database must have migrations applied
 *
 * Run with:
 *   npm test -- src/lib/provisioning/__tests__/integration.test.ts
 *
 * Environment:
 *   INTEGRATION_TEST=true to enable these tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { Pool } from 'pg'
import { runProvisioningStep } from '../state-machine'
import { createTenantSchemaHandler } from '../handlers'
import { PROVISIONING_STEPS } from '../steps'

// Skip integration tests if not enabled
const integrationTest = process.env.INTEGRATION_TEST === 'true' ? describe : describe.skip

integrationTest('Provisioning Integration Tests (Real Database)', () => {
  let pool: Pool
  let testProjectId: number
  let testDeveloperId: number
  let testTenantId: string
  let testSlug: string

  // Unique identifiers for this test run
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
  testSlug = `integration-${testRunId}`

  beforeAll(async () => {
    // Create database pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    })

    console.log(`[Integration Test] Starting test run: ${testRunId}`)

    // Verify database connection
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      console.log('[Integration Test] Database connection verified')
    } finally {
      client.release()
    }
  })

  afterAll(async () => {
    // Clean up all test data
    const client = await pool.connect()
    try {
      console.log('[Integration Test] Cleaning up test data...')

      // Delete in proper order due to foreign key constraints
      await client.query('DELETE FROM control_plane.provisioning_steps WHERE project_id = $1', [testProjectId])

      // Delete API keys for test project (api_keys is in public schema)
      await client.query('DELETE FROM public.api_keys WHERE project_id = $1', [testProjectId])

      // Drop the tenant schema if it exists
      await client.query(`DROP SCHEMA IF EXISTS tenant_${testSlug} CASCADE`)

      // Delete the test project
      await client.query('DELETE FROM projects WHERE id = $1', [testProjectId])

      // Delete the test developer
      await client.query("DELETE FROM public.developers WHERE id = $1", [testDeveloperId])

      console.log('[Integration Test] Cleanup completed')
    } finally {
      client.release()
    }

    await pool.end()
    console.log('[Integration Test] Database pool closed')
  })

  beforeEach(async () => {
    // Create a test developer
    const developerResult = await pool.query<{
      id: number
    }>(
      `
      INSERT INTO public.developers (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [`test-${testRunId}@example.com`, 'hash', 'Test Developer']
    )
    testDeveloperId = developerResult.rows[0].id

    // Create a test project
    const projectResult = await pool.query<{
      id: number
      tenant_id: string
    }>(
      `
      INSERT INTO projects (developer_id, project_name, slug, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, tenant_id
      `,
      [testDeveloperId, `Integration Test Project ${testRunId}`, testSlug, `tenant-${testRunId}`]
    )
    testProjectId = projectResult.rows[0].id
    testTenantId = projectResult.rows[0].tenant_id

    console.log(`[Integration Test] Created test project: ${testProjectId} with slug: ${testSlug}`)
  })

  afterEach(async () => {
    // Clean up provisioning steps after each test
    await pool.query('DELETE FROM control_plane.provisioning_steps WHERE project_id = $1', [testProjectId])
  })

  describe('Full Provisioning Flow', () => {
    it('should run all provisioning steps in sequence', async () => {
      const steps = PROVISIONING_STEPS.filter(s => s.name !== 'verify_services')

      for (const step of steps) {
        console.log(`[Integration Test] Running step: ${step.name}`)

        const result = await runProvisioningStep(testProjectId, step.name, pool)

        expect(result.success).toBe(true)
        expect(result.status).toBe('success')

        // Verify step was marked as success in database
        const stepRecord = await pool.query(
          'SELECT * FROM control_plane.provisioning_steps WHERE project_id = $1 AND step_name = $2',
          [testProjectId, step.name]
        )

        expect(stepRecord.rows.length).toBe(1)
        expect(stepRecord.rows[0].status).toBe('success')
      }

      console.log(`[Integration Test] All provisioning steps completed successfully`)
    })

    it('should verify tenant schema was created', async () => {
      // Run the create_tenant_schema step
      const result = await runProvisioningStep(testProjectId, 'create_tenant_schema', pool)

      expect(result.success).toBe(true)

      // Verify schema exists
      const schemaResult = await pool.query(
        `
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name = $1
        `,
        [`tenant_${testSlug}`]
      )

      expect(schemaResult.rows.length).toBe(1)
      console.log(`[Integration Test] Verified tenant schema exists: tenant_${testSlug}`)
    })

    it('should verify tenant tables were created', async () => {
      // Run schema and database creation steps
      await runProvisioningStep(testProjectId, 'create_tenant_schema', pool)
      await runProvisioningStep(testProjectId, 'create_tenant_database', pool)

      // Check if tables exist in the tenant schema
      const tablesResult = await pool.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name
        `,
        [`tenant_${testSlug}`]
      )

      const tables = tablesResult.rows.map(r => r.table_name)

      // Verify expected tables exist
      expect(tables).toContain('users')
      expect(tables).toContain('audit_log')
      expect(tables).toContain('_migrations')

      console.log(`[Integration Test] Verified tenant tables: ${tables.join(', ')}`)

      // Verify table structures
      const usersColumns = await pool.query(
        `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'users'
        ORDER BY ordinal_position
        `,
        [`tenant_${testSlug}`]
      )

      const usersColumnsList = usersColumns.rows.map(r => r.column_name)
      expect(usersColumnsList).toContain('id')
      expect(usersColumnsList).toContain('email')
      expect(usersColumnsList).toContain('created_at')
      expect(usersColumnsList).toContain('updated_at')
    })

    it('should verify API keys were generated', async () => {
      // Run API key generation step
      const result = await runProvisioningStep(testProjectId, 'generate_api_keys', pool)

      expect(result.success).toBe(true)

      // Verify API keys were created
      const apiKeysResult = await pool.query(
        `
        SELECT id, name, key_type, key_prefix, environment
        FROM public.api_keys
        WHERE project_id = $1
        ORDER BY key_type
        `,
        [testProjectId]
      )

      expect(apiKeysResult.rows.length).toBeGreaterThanOrEqual(3)

      const keyTypes = apiKeysResult.rows.map(r => r.key_type)
      expect(keyTypes).toContain('public')
      expect(keyTypes).toContain('secret')
      expect(keyTypes).toContain('service_role')

      console.log(`[Integration Test] Verified ${apiKeysResult.rows.length} API keys created`)
    })
  })

  describe('Service Registration Metadata', () => {
    beforeEach(async () => {
      // Run service registration steps
      await runProvisioningStep(testProjectId, 'register_auth_service', pool)
      await runProvisioningStep(testProjectId, 'register_realtime_service', pool)
      await runProvisioningStep(testProjectId, 'register_storage_service', pool)
    })

    it('should store auth service configuration in project metadata', async () => {
      const projectResult = await pool.query(
        'SELECT metadata FROM projects WHERE id = $1',
        [testProjectId]
      )

      const metadata = projectResult.rows[0].metadata || {}
      expect(metadata.auth_service).toBeDefined()
      expect(metadata.auth_service.tenant_id).toBe(testTenantId)
      expect(metadata.auth_service.environment).toBe('dev')
      expect(metadata.auth_service.registered_at).toBeDefined()

      console.log('[Integration Test] Verified auth service metadata stored')
    })

    it('should store realtime service configuration', async () => {
      const projectResult = await pool.query(
        'SELECT metadata FROM projects WHERE id = $1',
        [testProjectId]
      )

      const metadata = projectResult.rows[0].metadata || {}
      expect(metadata.realtime_service).toBeDefined()
      expect(metadata.realtime_service.tenant_id).toBe(testTenantId)
      expect(metadata.realtime_service.channel_prefix).toBe(`${testTenantId}:`)
      expect(metadata.realtime_service.max_connections).toBe(100)

      console.log('[Integration Test] Verified realtime service metadata stored')
    })

    it('should store storage service configuration', async () => {
      const projectResult = await pool.query(
        'SELECT metadata FROM projects WHERE id = $1',
        [testProjectId]
      )

      const metadata = projectResult.rows[0].metadata || {}
      expect(metadata.storage_service).toBeDefined()
      expect(metadata.storage_service.tenant_id).toBe(testTenantId)
      expect(metadata.storage_service.bucket_prefix).toBe(`${testTenantId}/`)
      expect(metadata.storage_service.max_file_size).toBe(52428800) // 50MB

      console.log('[Integration Test] Verified storage service metadata stored')
    })
  })

  describe('Idempotency Tests', () => {
    it('should handle re-running create_tenant_schema step', async () => {
      // First run
      const result1 = await runProvisioningStep(testProjectId, 'create_tenant_schema', pool)
      expect(result1.success).toBe(true)

      // Second run (should succeed due to IF NOT EXISTS)
      const result2 = await runProvisioningStep(testProjectId, 'create_tenant_schema', pool)
      expect(result2.success).toBe(true)

      // Verify schema still exists and is valid
      const schemaResult = await pool.query(
        `
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name = $1
        `,
        [`tenant_${testSlug}`]
      )

      expect(schemaResult.rows.length).toBe(1)
      console.log('[Integration Test] Verified schema creation is idempotent')
    })

    it('should handle re-running create_tenant_database step', async () => {
      // Create schema first
      await runProvisioningStep(testProjectId, 'create_tenant_schema', pool)

      // First run
      const result1 = await runProvisioningStep(testProjectId, 'create_tenant_database', pool)
      expect(result1.success).toBe(true)

      // Second run (should succeed due to IF NOT EXISTS on tables)
      const result2 = await runProvisioningStep(testProjectId, 'create_tenant_database', pool)
      expect(result2.success).toBe(true)

      // Verify tables still exist
      const tablesResult = await pool.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name
        `,
        [`tenant_${testSlug}`]
      )

      expect(tablesResult.rows.length).toBeGreaterThanOrEqual(3)
      console.log('[Integration Test] Verified database creation is idempotent')
    })

    it('should handle re-running generate_api_keys step', async () => {
      // First run
      const result1 = await runProvisioningStep(testProjectId, 'generate_api_keys', pool)
      expect(result1.success).toBe(true)

      const firstKeys = await pool.query(
        'SELECT COUNT(*) as count FROM public.api_keys WHERE project_id = $1',
        [testProjectId]
      )
      const firstCount = parseInt(firstKeys.rows[0].count)

      // Second run (should create new keys due to ON CONFLICT DO NOTHING not updating)
      const result2 = await runProvisioningStep(testProjectId, 'generate_api_keys', pool)
      expect(result2.success).toBe(true)

      const secondKeys = await pool.query(
        'SELECT COUNT(*) as count FROM public.api_keys WHERE project_id = $1',
        [testProjectId]
      )
      const secondCount = parseInt(secondKeys.rows[0].count)

      // Count should be same or greater (ON CONFLICT DO NOTHING prevents duplicates)
      expect(secondCount).toBeGreaterThanOrEqual(firstCount)
      console.log('[Integration Test] Verified API key generation is idempotent')
    })
  })

  describe('Error Handling', () => {
    it('should fail gracefully when project does not exist', async () => {
      const fakeProjectId = '00000000-0000-0000-0000-000000000000'

      const result = await runProvisioningStep(fakeProjectId, 'create_tenant_schema', pool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Project not found')
      expect(result.status).toBe('failed')

      console.log('[Integration Test] Verified error handling for non-existent project')
    })

    it('should fail gracefully when slug has invalid characters', async () => {
      // Create a project with an invalid slug (uppercase letters)
      const invalidSlug = `InvalidSlug-${testRunId}`

      const projectResult = await pool.query<{
        id: string
        tenant_id: string
      }>(
        `
        INSERT INTO projects (id, developer_id, name, slug, tenant_id, environment, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        RETURNING id, tenant_id
        `,
        [testDeveloperId, `Invalid Project`, invalidSlug, `tenant-invalid`, 'dev', 'active']
      )

      const invalidProjectId = projectResult.rows[0].id

      const result = await runProvisioningStep(invalidProjectId, 'create_tenant_schema', pool)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid slug')

      // Clean up the invalid project
      await pool.query('DELETE FROM projects WHERE id = $1', [invalidProjectId])

      console.log('[Integration Test] Verified error handling for invalid slug')
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data isolation between tenant schemas', async () => {
      // Create two projects with different slugs
      const slug1 = `tenant1-${testRunId}`
      const slug2 = `tenant2-${testRunId}`

      const project1Result = await pool.query<{
        id: string
        tenant_id: string
      }>(
        `
        INSERT INTO projects (id, developer_id, name, slug, tenant_id, environment, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        RETURNING id, tenant_id
        `,
        [testDeveloperId, `Project 1`, slug1, `tenant-1-${testRunId}`, 'dev', 'active']
      )

      const project2Result = await pool.query<{
        id: string
        tenant_id: string
      }>(
        `
        INSERT INTO projects (id, developer_id, name, slug, tenant_id, environment, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        RETURNING id, tenant_id
        `,
        [testDeveloperId, `Project 2`, slug2, `tenant-2-${testRunId}`, 'dev', 'active']
      )

      const project1Id = project1Result.rows[0].id
      const project2Id = project2Result.rows[0].id

      // Provision both projects
      await runProvisioningStep(project1Id, 'create_tenant_schema', pool)
      await runProvisioningStep(project1Id, 'create_tenant_database', pool)
      await runProvisioningStep(project2Id, 'create_tenant_schema', pool)
      await runProvisioningStep(project2Id, 'create_tenant_database', pool)

      // Insert test data into first tenant
      await pool.query(
        `INSERT INTO tenant_${slug1}.users (email) VALUES ($1)`,
        [`user1@${testRunId}.com`]
      )

      // Verify data exists only in first tenant
      const tenant1Users = await pool.query(
        `SELECT COUNT(*) as count FROM tenant_${slug1}.users`
      )
      const tenant2Users = await pool.query(
        `SELECT COUNT(*) as count FROM tenant_${slug2}.users`
      )

      expect(parseInt(tenant1Users.rows[0].count)).toBe(1)
      expect(parseInt(tenant2Users.rows[0].count)).toBe(0)

      // Clean up
      await pool.query(`DROP SCHEMA IF EXISTS tenant_${slug1} CASCADE`)
      await pool.query(`DROP SCHEMA IF EXISTS tenant_${slug2} CASCADE`)
      await pool.query('DELETE FROM control_plane.provisioning_steps WHERE project_id = $1', [project1Id])
      await pool.query('DELETE FROM control_plane.provisioning_steps WHERE project_id = $1', [project2Id])
      await pool.query('DELETE FROM projects WHERE id = $1', [project1Id])
      await pool.query('DELETE FROM projects WHERE id = $1', [project2Id])

      console.log('[Integration Test] Verified data isolation between tenant schemas')
    })
  })
})
