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

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from '../steps'

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
