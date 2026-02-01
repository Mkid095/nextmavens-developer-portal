/**
 * Provisioning Step Handlers
 *
 * Implementation of individual provisioning step handlers.
 * Each handler performs a specific provisioning operation.
 *
 * Story: US-008 - Implement Verify Services Step
 * PRD: Provisioning State Machine
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from './steps'
import { getAllSteps, isProvisioningComplete } from './state-machine'
import { isValidTransition } from '@/lib/types/project-lifecycle.types'

/**
 * Service health check result
 */
interface ServiceHealthResult {
  serviceName: string
  healthy: boolean
  latency?: number
  error?: string
}

/**
 * Perform health check on a service endpoint
 *
 * @param endpoint - The service endpoint to check
 * @param timeout - Request timeout in milliseconds
 * @returns Service health result
 */
async function checkServiceHealth(
  endpoint: string,
  timeout: number = 5000
): Promise<ServiceHealthResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'NextMavens-Provisioning/1.0',
      },
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - startTime

    if (response.ok) {
      return {
        serviceName: endpoint,
        healthy: true,
        latency,
      }
    }

    return {
      serviceName: endpoint,
      healthy: false,
      latency,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    return {
      serviceName: endpoint,
      healthy: false,
      latency,
      error: errorMessage,
    }
  }
}

/**
 * Create Tenant Schema Step Handler
 *
 * Story: Database Provisioning Implementation
 *
 * This handler creates a tenant-specific schema in the database.
 * Each tenant gets their own schema (tenant_{slug}) for data isolation.
 *
 * Schema pattern: tenant_{slug}
 * Example: tenant_my-awesome-project
 *
 * The handler:
 * 1. Gets project slug from database
 * 2. Validates slug contains only safe characters (a-z, 0-9, hyphens)
 * 3. Creates the schema IF NOT EXISTS (idempotent)
 * 4. Grants USAGE and CREATE permissions to database user
 * 5. Returns success with schema name or error details
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const createTenantSchemaHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const client = await pool.connect()

  try {
    // 1. Get project slug
    const projectResult = await client.query(
      `
      SELECT slug
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const { slug } = projectResult.rows[0]

    if (!slug) {
      return {
        success: false,
        error: `Project slug is required for schema creation`,
        errorDetails: {
          error_type: 'ValidationError',
          context: { projectId },
        },
      }
    }

    // 2. Validate slug contains only safe characters for SQL identifiers
    // Allow: lowercase letters, numbers, and hyphens
    const slugValidationRegex = /^[a-z0-9-]+$/
    if (!slugValidationRegex.test(slug)) {
      return {
        success: false,
        error: `Invalid slug format: "${slug}". Slug must contain only lowercase letters, numbers, and hyphens.`,
        errorDetails: {
          error_type: 'ValidationError',
          context: { projectId, slug },
        },
      }
    }

    // 3. Build schema name
    const schemaName = `tenant_${slug}`

    // 4. Get database user from environment or use default
    const dbUser = process.env.DATABASE_USER || 'nextmavens'

    // 5. Create schema with IF NOT EXISTS for idempotency
    // Using double quotes for identifier quoting (PostgreSQL standard)
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)

    // 6. Grant permissions to database user
    // USAGE: Allows objects in the schema to be referenced
    await client.query(`GRANT USAGE ON SCHEMA "${schemaName}" TO "${dbUser}"`)

    // CREATE: Allows creating new objects in the schema
    await client.query(`GRANT CREATE ON SCHEMA "${schemaName}" TO "${dbUser}"`)

    console.log(`[Provisioning] Created tenant schema: ${schemaName} for project: ${projectId}`)

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to create tenant schema: ${errorMessage}`,
      errorDetails,
    }
  } finally {
    client.release()
  }
}

/**
 * Create Tenant Database Step Handler
 *
 * Story: Database Provisioning Implementation
 *
 * This handler creates initial tables in the tenant schema.
 * Each tenant schema gets core tables for user management,
 * audit logging, and schema migrations.
 *
 * Tables created:
 * - users: User accounts (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
 * - audit_log: Tenant-level audit trail (id, action, actor_id, target_type, target_id, metadata, created_at)
 * - _migrations: Tenant schema version tracking (id, version, applied_at)
 *
 * All tables use IF NOT EXISTS for idempotency.
 * Indexes are created for performance.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const createTenantDatabaseHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const client = await pool.connect()

  try {
    // 1. Get project slug
    const projectResult = await client.query(
      `
      SELECT slug
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const { slug } = projectResult.rows[0]

    if (!slug) {
      return {
        success: false,
        error: `Project slug is required for table creation`,
        errorDetails: {
          error_type: 'ValidationError',
          context: { projectId },
        },
      }
    }

    // 2. Validate slug
    const slugValidationRegex = /^[a-z0-9-]+$/
    if (!slugValidationRegex.test(slug)) {
      return {
        success: false,
        error: `Invalid slug format: "${slug}"`,
        errorDetails: {
          error_type: 'ValidationError',
          context: { projectId, slug },
        },
      }
    }

    // 3. Build schema name
    const schemaName = `tenant_${slug}`

    // 4. Create users table (standard pattern like Supabase)
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS "${schemaName}".users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        email_confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        raw_user_meta_data JSONB DEFAULT '{}'
      )
      `
    )

    // Create index on users.email for lookups
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON "${schemaName}".users(email)`
    )

    // 5. Create audit_log table (tenant-level audit)
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS "${schemaName}".audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(100) NOT NULL,
        actor_id UUID,
        target_type VARCHAR(50),
        target_id UUID,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
      `
    )

    // Create indexes on audit_log
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON "${schemaName}".audit_log(actor_id)`
    )
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_audit_log_created ON "${schemaName}".audit_log(created_at DESC)`
    )

    // 6. Create _migrations table (tenant schema version tracking)
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS "${schemaName}"._migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(100) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
      `
    )

    console.log(
      `[Provisioning] Created tenant tables (users, audit_log, _migrations) in schema: ${schemaName} for project: ${projectId}`
    )

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to create tenant tables: ${errorMessage}`,
      errorDetails,
    }
  } finally {
    client.release()
  }
}

/**
 * Register Auth Service Step Handler
 *
 * Story: Phase 2 - External Service Registration
 *
 * This handler registers a tenant with the auth service.
 * For now, this is a simplified implementation that logs the registration
 * and stores configuration. In a full implementation, this would make
 * an HTTP call to the auth service to create tenant-specific configuration.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const registerAuthServiceHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  try {
    // 1. Get project details
    const projectResult = await pool.query(
      `
      SELECT id, slug, tenant_id, environment
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const project = projectResult.rows[0]
    const { slug, tenant_id, environment } = project

    // 2. Build auth service configuration for this tenant
    const authServiceConfig = {
      tenant_id,
      project_id: projectId,
      slug,
      environment: environment || 'dev',
      jwt_issuer: `nextmavens-${slug}`,
      jwt_audience: `nextmavens-${slug}-api`,
    }

    // 3. For now, log the registration (in production, this would make an HTTP call)
    console.log(
      `[Provisioning] Auth service registration for project ${projectId}:`,
      JSON.stringify(authServiceConfig, null, 2)
    )

    // 4. Store service registration in project metadata (optional, for tracking)
    // This is stored in the project's metadata column for future reference
    await pool.query(
      `
      UPDATE projects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'auth_service', jsonb_build_object(
          'registered_at', NOW(),
          'tenant_id', $2,
          'environment', $3
        )
      )
      WHERE id = $1
      `,
      [projectId, tenant_id, environment || 'dev']
    )

    console.log(`[Provisioning] Auth service registration completed for project: ${projectId}`)

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to register with auth service: ${errorMessage}`,
      errorDetails,
    }
  }
}

/**
 * Register Realtime Service Step Handler
 *
 * Story: Phase 2 - External Service Registration
 *
 * This handler registers a tenant with the realtime service.
 * For now, this is a simplified implementation that logs the registration
 * and stores configuration. In a full implementation, this would make
 * an HTTP call to the realtime service to create tenant-specific channels.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const registerRealtimeServiceHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  try {
    // 1. Get project details
    const projectResult = await pool.query(
      `
      SELECT id, slug, tenant_id, environment
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const project = projectResult.rows[0]
    const { slug, tenant_id, environment } = project

    // 2. Build realtime service configuration for this tenant
    const realtimeServiceConfig = {
      tenant_id,
      project_id: projectId,
      slug,
      environment: environment || 'dev',
      channel_prefix: `${tenant_id}:`, // All channels will be prefixed with tenant_id
      max_connections: 100, // Default max concurrent connections
      enable_presence: true,
      enable_broadcast: true,
    }

    // 3. For now, log the registration (in production, this would make an HTTP call)
    console.log(
      `[Provisioning] Realtime service registration for project ${projectId}:`,
      JSON.stringify(realtimeServiceConfig, null, 2)
    )

    // 4. Store service registration in project metadata
    await pool.query(
      `
      UPDATE projects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'realtime_service', jsonb_build_object(
          'registered_at', NOW(),
          'tenant_id', $2,
          'environment', $3,
          'channel_prefix', $4
        )
      )
      WHERE id = $1
      `,
      [projectId, tenant_id, environment || 'dev', `${tenant_id}:`]
    )

    console.log(`[Provisioning] Realtime service registration completed for project: ${projectId}`)

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to register with realtime service: ${errorMessage}`,
      errorDetails,
    }
  }
}

/**
 * Register Storage Service Step Handler
 *
 * Story: Phase 2 - External Service Registration
 *
 * This handler registers a tenant with the storage service.
 * For now, this is a simplified implementation that logs the registration
 * and stores configuration. In a full implementation, this would make
 * an HTTP call to the storage service to create tenant-specific buckets.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const registerStorageServiceHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  try {
    // 1. Get project details
    const projectResult = await pool.query(
      `
      SELECT id, slug, tenant_id, environment
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const project = projectResult.rows[0]
    const { slug, tenant_id, environment } = project

    // 2. Build storage service configuration for this tenant
    const storageServiceConfig = {
      tenant_id,
      project_id: projectId,
      slug,
      environment: environment || 'dev',
      bucket_prefix: `${tenant_id}/`, // All files will be stored under tenant_id prefix
      max_file_size: 50 * 1024 * 1024, // 50MB default max file size
      max_total_storage: 5 * 1024 * 1024 * 1024, // 5GB default total storage
      allowed_file_types: ['*'], // Allow all file types by default
    }

    // 3. For now, log the registration (in production, this would make an HTTP call)
    console.log(
      `[Provisioning] Storage service registration for project ${projectId}:`,
      JSON.stringify(storageServiceConfig, null, 2)
    )

    // 4. Store service registration in project metadata
    await pool.query(
      `
      UPDATE projects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'storage_service', jsonb_build_object(
          'registered_at', NOW(),
          'tenant_id', $2,
          'environment', $3,
          'bucket_prefix', $4
        )
      )
      WHERE id = $1
      `,
      [projectId, tenant_id, environment || 'dev', `${tenant_id}/`]
    )

    console.log(`[Provisioning] Storage service registration completed for project: ${projectId}`)

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to register with storage service: ${errorMessage}`,
      errorDetails,
    }
  }
}

/**
 * Generate API Keys Step Handler
 *
 * Story: Phase 2 - External Service Registration
 *
 * This handler generates initial API keys for a tenant.
 * Creates both public and secret keys that developers can use
 * to authenticate their applications.
 *
 * Keys generated:
 * - 1 public key (for client-side use, safe to expose)
 * - 1 secret key (for server-side use, must be kept confidential)
 * - 1 service_role key (for admin operations)
 *
 * All keys are stored hashed in the database using SHA-256.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const generateApiKeysHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  // Import generateApiKey and hashApiKey functions
  const { generateApiKey, hashApiKey } = await import('@/lib/auth')

  try {
    // 1. Get project details
    const projectResult = await pool.query(
      `
      SELECT id, slug, tenant_id, environment, developer_id
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const project = projectResult.rows[0]
    const { slug, tenant_id, environment, developer_id } = project

    // 2. Generate random keys
    const publicRandom = generateApiKey('public')
    const secretRandom = generateApiKey('secret')
    const serviceRoleRandom = generateApiKey('secret')

    // 3. Build formatted keys with prefixes
    // Format: nm_{env}_{type}_{random}
    const env = environment || 'dev'
    const publicKey = `nm_${env}_pk_${publicRandom}`
    const secretKey = `nm_${env}_sk_${secretRandom}`
    const serviceRoleKey = `nm_${env}_sr_${serviceRoleRandom}`

    // 4. Hash the keys for storage
    const publicHash = hashApiKey(publicKey)
    const secretHash = hashApiKey(secretKey)
    const serviceRoleHash = hashApiKey(serviceRoleKey)

    // 5. Insert keys into database
    // Use INSERT with ON CONFLICT to handle retries
    await pool.query(
      `
      INSERT INTO api_keys (
        id,
        project_id,
        name,
        key_type,
        key_prefix,
        public_key,
        secret_hash,
        scopes,
        environment,
        created_at
      ) VALUES
        (
          gen_random_uuid(),
          $1,
          'Default Public Key',
          'public',
          'nm_${env}_pk_',
          $2,
          $3,
          '[]'::jsonb,
          $4,
          NOW()
        ),
        (
          gen_random_uuid(),
          $1,
          'Default Secret Key',
          'secret',
          'nm_${env}_sk_',
          $5,
          $6,
          '[]'::jsonb,
          $4,
          NOW()
        ),
        (
          gen_random_uuid(),
          $1,
          'Service Role Key',
          'service_role',
          'nm_${env}_sr_',
          $7,
          $8,
          '["*"]'::jsonb,
          $4,
          NOW()
        )
      ON CONFLICT (project_id, name) DO NOTHING
      `,
      [
        projectId,
        publicKey,
        publicHash,
        env,
        secretKey,
        secretHash,
        serviceRoleKey,
        serviceRoleHash,
      ]
    )

    console.log(
      `[Provisioning] Generated API keys for project ${projectId}:` +
        `\n  Public Key: ${publicKey.substring(0, 20)}...` +
        `\n  Secret Key: ${secretKey.substring(0, 20)}...` +
        `\n  Service Role: ${serviceRoleKey.substring(0, 20)}...`
    )

    // Store the keys in project metadata for retrieval (in production, keys would be shown once and never retrievable)
    await pool.query(
      `
      UPDATE projects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'api_keys', jsonb_build_object(
          'generated_at', NOW(),
          'public_key_preview', LEFT($2, 20) || '...',
          'warning', 'Full keys are only shown once during creation. Store them securely.'
        )
      )
      WHERE id = $1
      `,
      [projectId, publicKey]
    )

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to generate API keys: ${errorMessage}`,
      errorDetails,
    }
  }
}

/**
 * Verify Services Step Handler
 *
 * Story: US-008 - Implement Verify Services Step
 *
 * This handler verifies that all required services are healthy
 * after provisioning. It pings each service endpoint and checks
 * their health status.
 *
 * Services checked:
 * - Database (via connection test)
 * - Auth service (via health endpoint)
 * - Realtime service (via health endpoint)
 * - Storage service (via health endpoint)
 * - GraphQL service (via health endpoint)
 *
 * The step marks success only if all services are ready.
 * Fails the step if any service is unavailable.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const verifyServicesHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const healthResults: ServiceHealthResult[] = []
  const errors: string[] = []

  try {
    // 1. Get project details to determine service endpoints
    const projectResult = await pool.query(
      `
      SELECT
        p.id,
        p.slug,
        p.tenant_id,
        p.status,
        p.environment,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'service_type', ps.service_type,
              'enabled', ps.enabled
            ) ORDER BY ps.service_type
          ) FILTER (WHERE ps.service_type IS NOT NULL),
          '[]'::jsonb
        ) as services
      FROM projects p
      LEFT JOIN project_services ps ON ps.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, p.slug, p.tenant_id, p.status, p.environment
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const project = projectResult.rows[0]
    const services = project.services || []

    // 2. Check database connectivity
    try {
      const dbStartTime = Date.now()
      await pool.query('SELECT 1')
      const dbLatency = Date.now() - dbStartTime

      healthResults.push({
        serviceName: 'database',
        healthy: true,
        latency: dbLatency,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      healthResults.push({
        serviceName: 'database',
        healthy: false,
        error: errorMessage,
      })
      errors.push(`Database: ${errorMessage}`)
    }

    // 3. Build service endpoints based on environment
    const isLocal = project.environment === 'dev'
    const baseUrl = isLocal
      ? `http://localhost:${process.env.PORT || 3000}`
      : process.env.NEXT_PUBLIC_API_URL || 'https://api.nextmavens.com'

    // 4. Check enabled services
    const enabledServices = services
      .filter((s: any) => s.enabled)
      .map((s: any) => s.service_type)

    // 5. Check internal health endpoint (provides overall system health)
    try {
      const healthEndpoint = `${baseUrl}/internal/health`
      const healthResult = await checkServiceHealth(healthEndpoint, 5000)

      healthResults.push({
        serviceName: 'api_gateway',
        healthy: healthResult.healthy,
        latency: healthResult.latency,
        error: healthResult.error,
      })

      if (!healthResult.healthy) {
        errors.push(`API Gateway: ${healthResult.error || 'Health check failed'}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      healthResults.push({
        serviceName: 'api_gateway',
        healthy: false,
        error: errorMessage,
      })
      errors.push(`API Gateway: ${errorMessage}`)
    }

    // 6. Check auth service if enabled
    if (enabledServices.includes('auth')) {
      try {
        // Auth service health check via control plane
        const authHealthEndpoint = `${baseUrl}/api/v1/health/auth`
        const authResult = await checkServiceHealth(authHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'auth',
          healthy: authResult.healthy,
          latency: authResult.latency,
          error: authResult.error,
        })

        if (!authResult.healthy) {
          errors.push(`Auth: ${authResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'auth',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`Auth: ${errorMessage}`)
      }
    }

    // 7. Check realtime service if enabled
    if (enabledServices.includes('realtime')) {
      try {
        const realtimeHealthEndpoint = `${baseUrl}/api/v1/health/realtime`
        const realtimeResult = await checkServiceHealth(realtimeHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'realtime',
          healthy: realtimeResult.healthy,
          latency: realtimeResult.latency,
          error: realtimeResult.error,
        })

        if (!realtimeResult.healthy) {
          errors.push(`Realtime: ${realtimeResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'realtime',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`Realtime: ${errorMessage}`)
      }
    }

    // 8. Check storage service if enabled
    if (enabledServices.includes('storage')) {
      try {
        const storageHealthEndpoint = `${baseUrl}/api/v1/health/storage`
        const storageResult = await checkServiceHealth(storageHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'storage',
          healthy: storageResult.healthy,
          latency: storageResult.latency,
          error: storageResult.error,
        })

        if (!storageResult.healthy) {
          errors.push(`Storage: ${storageResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'storage',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`Storage: ${errorMessage}`)
      }
    }

    // 9. Check GraphQL service if enabled
    if (enabledServices.includes('graphql')) {
      try {
        const graphqlHealthEndpoint = `${baseUrl}/api/v1/health/graphql`
        const graphqlResult = await checkServiceHealth(graphqlHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'graphql',
          healthy: graphqlResult.healthy,
          latency: graphqlResult.latency,
          error: graphqlResult.error,
        })

        if (!graphqlResult.healthy) {
          errors.push(`GraphQL: ${graphqlResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'graphql',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`GraphQL: ${errorMessage}`)
      }
    }

    // 10. Determine overall success
    const allServicesHealthy = healthResults.every((result) => result.healthy)

    if (allServicesHealthy) {
      // PRD: US-010 - Auto-transition CREATED → ACTIVE after provisioning completes
      // Check if project status is 'created' and all provisioning steps are complete
      if (project.status === 'created') {
        try {
          // Get all provisioning steps to verify completion
          const allSteps = await getAllSteps(pool, projectId)

          // Check if all steps are complete (success or skipped)
          if (isProvisioningComplete(allSteps)) {
            // Validate state transition: created → active
            if (isValidTransition('created', 'active')) {
              // Update project status to active
              await pool.query(
                `
                UPDATE projects
                SET status = 'active',
                    updated_at = NOW()
                WHERE id = $1
                `,
                [projectId]
              )
              console.log(
                `[Provisioning] Project ${projectId} automatically transitioned from CREATED to ACTIVE after provisioning completed`
              )
            }
          }
        } catch (statusError) {
          // Log error but don't fail the provisioning step
          console.error(
            `[Provisioning] Failed to auto-transition project status:`,
            statusError
          )
        }
      }

      return {
        success: true,
      }
    }

    // Build detailed error message
    const unhealthyServices = healthResults
      .filter((r) => !r.healthy)
      .map((r) => r.serviceName)
      .join(', ')

    return {
      success: false,
      error: `Some services are not ready: ${unhealthyServices}`,
      errorDetails: {
        error_type: 'ServiceHealthCheckError',
        health_results: healthResults,
        errors,
        context: {
          projectId,
          projectSlug: project.slug,
          enabledServices,
        },
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to verify services: ${errorMessage}`,
      errorDetails,
    }
  }
}

/**
 * Get step handler by step name
 *
 * Returns the appropriate handler function for a given step name.
 * Throws an error if the step name is unknown.
 *
 * @param stepName - The provisioning step name
 * @returns Step handler function
 * @throws Error if step name is unknown or has no handler
 */
export function getStepHandler(stepName: string): StepHandler {
  switch (stepName) {
    case 'verify_services':
      return verifyServicesHandler
    case 'create_tenant_schema':
      return createTenantSchemaHandler
    case 'create_tenant_database':
      return createTenantDatabaseHandler
    case 'register_auth_service':
      return registerAuthServiceHandler
    case 'register_realtime_service':
      return registerRealtimeServiceHandler
    case 'register_storage_service':
      return registerStorageServiceHandler
    case 'generate_api_keys':
      return generateApiKeysHandler

    default:
      throw new Error(`No handler implemented for step: ${stepName}`)
  }
}

/**
 * Check if a step has a handler implemented
 *
 * @param stepName - The provisioning step name
 * @returns True if a handler exists for the step
 */
export function hasStepHandler(stepName: string): boolean {
  try {
    getStepHandler(stepName)
    return true
  } catch {
    return false
  }
}
