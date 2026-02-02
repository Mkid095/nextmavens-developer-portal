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
 * Row Level Security (RLS):
 * - All tables have RLS enabled by default
 * - Users can only access their own data (based on app.user_id session variable)
 * - Admins bypass RLS when app.user_role = 'admin'
 *
 * All tables use IF NOT EXISTS for idempotency.
 * Indexes are created for performance.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from '../steps'
import { createPolicyIdempotently } from './utils'

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

    // 7. Enable Row Level Security on users table
    await client.query(`ALTER TABLE "${schemaName}".users ENABLE ROW LEVEL SECURITY`)

    // 8. Create RLS policies for users table
    // Users can read their own record
    await createPolicyIdempotently(
      client,
      `
      CREATE POLICY users_select_own ON "${schemaName}".users
      FOR SELECT
      USING (
        id = current_setting('app.user_id', true)::uuid
        OR current_setting('app.user_role', true) = 'admin'
      )
      `
    )

    // Users can update their own record
    await createPolicyIdempotently(
      client,
      `
      CREATE POLICY users_update_own ON "${schemaName}".users
      FOR UPDATE
      USING (
        id = current_setting('app.user_id', true)::uuid
        OR current_setting('app.user_role', true) = 'admin'
      )
      `
    )

    // Service roles can insert new users (for signup)
    await createPolicyIdempotently(
      client,
      `
      CREATE POLICY users_insert_service ON "${schemaName}".users
      FOR INSERT
      WITH CHECK (
        current_setting('app.user_role', true) IN ('service', 'admin')
      )
      `
    )

    // 9. Enable Row Level Security on audit_log table
    await client.query(`ALTER TABLE "${schemaName}".audit_log ENABLE ROW LEVEL SECURITY`)

    // 10. Create RLS policies for audit_log table
    // Users can read audit logs where they are the actor
    await createPolicyIdempotently(
      client,
      `
      CREATE POLICY audit_log_select_own ON "${schemaName}".audit_log
      FOR SELECT
      USING (
        actor_id = current_setting('app.user_id', true)::uuid
        OR current_setting('app.user_role', true) = 'admin'
      )
      `
    )

    // Service roles and admins can insert audit logs
    await createPolicyIdempotently(
      client,
      `
      CREATE POLICY audit_log_insert_service ON "${schemaName}".audit_log
      FOR INSERT
      WITH CHECK (
        current_setting('app.user_role', true) IN ('service', 'admin')
      )
      `
    )

    // 11. Enable Row Level Security on _migrations table
    await client.query(`ALTER TABLE "${schemaName}"._migrations ENABLE ROW LEVEL SECURITY`)

    // 12. Create RLS policies for _migrations table
    // Only service roles and admins can read migrations
    await createPolicyIdempotently(
      client,
      `
      CREATE POLICY migrations_select_service ON "${schemaName}"._migrations
      FOR SELECT
      USING (
        current_setting('app.user_role', true) IN ('service', 'admin')
      )
      `
    )

    // Only service roles can insert migrations
    await createPolicyIdempotently(
      client,
      `
      CREATE POLICY migrations_insert_service ON "${schemaName}"._migrations
      FOR INSERT
      WITH CHECK (
        current_setting('app.user_role', true) = 'service'
      )
      `
    )

    console.log(
      `[Provisioning] Created tenant tables (users, audit_log, _migrations) with RLS policies in schema: ${schemaName} for project: ${projectId}`
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
