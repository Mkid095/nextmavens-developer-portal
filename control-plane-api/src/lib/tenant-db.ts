/**
 * US-002: Scope Database Queries
 *
 * This module provides tenant-aware database connections with search_path isolation.
 * All tenant queries are scoped to tenant_{slug} schema to prevent cross-project access.
 */

import { Pool, PoolClient } from 'pg'
import { getPool } from './db'

/**
 * Error codes for tenant access violations
 */
export enum TenantAccessError {
  CROSS_SCHEMA_ACCESS = 'CROSS_SCHEMA_ACCESS',
  INVALID_TENANT = 'INVALID_TENANT',
  QUERY_BLOCKED = 'QUERY_BLOCKED',
}

/**
 * Tenant context information
 */
export interface TenantContext {
  tenantId: string
  slug: string
  projectId: string
}

/**
 * Result of a tenant query
 */
export interface TenantQueryResult<T = any> {
  success: boolean
  data?: T[]
  error?: {
    code: string
    message: string
  }
}

/**
 * Get tenant context by project ID
 * Queries the control_plane schema to find tenant information
 */
export async function getTenantContext(projectId: string): Promise<TenantContext | null> {
  const pool = getPool()

  const result = await pool.query(
    `SELECT p.id as project_id, p.tenant_id, t.slug
     FROM control_plane.projects p
     JOIN control_plane.tenants t ON p.tenant_id = t.id
     WHERE p.id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    tenantId: row.tenant_id,
    slug: row.slug,
    projectId: row.project_id,
  }
}

/**
 * Get tenant context by JWT payload
 */
export async function getTenantContextFromJwt(projectId: string): Promise<TenantContext> {
  const context = await getTenantContext(projectId)

  if (!context) {
    throw new Error(TenantAccessError.INVALID_TENANT)
  }

  return context
}

/**
 * Validate that a query only accesses tenant schema tables
 * Blocks cross-schema queries by checking for schema-qualified table names
 */
export function validateTenantQuery(query: string): { valid: boolean; error?: string } {
  // Check for schema-qualified table names (e.g., other_tenant.table, public.table)
  // Allow: unqualified names, tenant-specific names, control_plane schema
  const schemaPattern = /["']?(\w+)["']?\.["']?(\w+)["']?/g

  const matches = [...query.matchAll(schemaPattern)]

  for (const match of matches) {
    const schema = match[1]
    const table = match[2]

    // Allow control_plane schema for system queries
    if (schema === 'control_plane') {
      continue
    }

    // Block any other schema-qualified access
    // This prevents cross-tenant queries and system schema access
    return {
      valid: false,
      error: `Cross-schema access detected: ${schema}.${table}. Only unqualified tables and control_plane schema are allowed.`,
    }
  }

  return { valid: true }
}

/**
 * Create a tenant-scoped query executor
 * Returns functions that automatically set search_path and validate queries
 */
export class TenantQueryExecutor {
  private tenantContext: TenantContext
  private pool: Pool

  constructor(tenantContext: TenantContext) {
    this.tenantContext = tenantContext
    this.pool = getPool()
  }

  /**
   * Get a database client with search_path set to tenant schema
   */
  private async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect()

    try {
      // Set search_path to tenant_{slug} schema
      // This ensures all unqualified table names reference the tenant's schema
      const schemaName = `tenant_${this.tenantContext.slug}`
      await client.query(`SET search_path TO ${schemaName}`)

      return client
    } catch (error) {
      client.release()
      throw error
    }
  }

  /**
   * Execute a query in the tenant's schema
   * Validates that the query doesn't attempt cross-schema access
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<TenantQueryResult<T>> {
    // Validate query for cross-schema access attempts
    const validation = validateTenantQuery(sql)
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: TenantAccessError.CROSS_SCHEMA_ACCESS,
          message: validation.error!,
        },
      }
    }

    const client = await this.getClient()

    try {
      const result = await client.query(sql, params)
      return {
        success: true,
        data: result.rows,
      }
    } catch (error) {
      // Check for permission denied errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase()

        if (message.includes('permission denied') || message.includes('access denied')) {
          return {
            success: false,
            error: {
              code: TenantAccessError.QUERY_BLOCKED,
              message: 'Access to other project\'s resources not permitted',
            },
          }
        }
      }

      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Execute a transaction in the tenant's schema
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const client = await this.getClient()

    try {
      await client.query('BEGIN')

      const result = await callback(client)

      await client.query('COMMIT')

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      await client.query('ROLLBACK')

      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: false,
        error: 'Unknown error',
      }
    } finally {
      client.release()
    }
  }

  /**
   * Get the tenant context
   */
  getContext(): TenantContext {
    return this.tenantContext
  }
}

/**
 * Create a tenant query executor from a project ID
 * Convenience function that looks up tenant context and creates executor
 */
export async function createTenantExecutor(
  projectId: string
): Promise<TenantQueryExecutor> {
  const context = await getTenantContextFromJwt(projectId)
  return new TenantQueryExecutor(context)
}

/**
 * US-002: Check if a query is accessing control_plane schema
 * Used to differentiate between tenant queries and system queries
 */
export function isControlPlaneQuery(query: string): boolean {
  return /control_plane\.\w+/.test(query)
}
