/**
 * Schema Scope Middleware - Schema Scoping Functions
 *
 * Middleware for scoping database queries to tenant-specific schemas.
 * Enforces project isolation by setting search_path based on project_id.
 *
 * US-002: Scope Database Queries
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Pool, PoolClient } from 'pg'
import { getPool } from '@/lib/db'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import {
  toErrorNextResponse,
  permissionDeniedError,
  notFoundError,
  internalError,
} from '@/lib/errors'
import { getTenantSlug } from './cache'
import { validateQueryIsolation } from './validation'
import {
  SchemaScopeError,
  type ScopedPool,
  type ScopedClient,
} from './types'

/**
 * Initialize schema scope for a connection
 * Sets search_path to tenant_{tenant_slug}
 *
 * @param client - The database client
 * @param tenantSlug - The tenant slug
 * @throws Error if schema init fails
 */
async function initSchemaScope(client: PoolClient, tenantSlug: string): Promise<void> {
  const schemaName = `tenant_${tenantSlug}`

  try {
    // Set search_path for this connection
    await client.query(`SET search_path TO ${schemaName}, public`)
  } catch (error) {
    console.error('[Schema Scope] Failed to set search_path:', error)
    throw new Error(SchemaScopeError.SCHEMA_INIT_FAILED)
  }
}

/**
 * Get a schema-scoped pool for the current request
 * The pool will have search_path set to tenant_{project_id}
 *
 * This function:
 * 1. Authenticates the request and extracts project_id from JWT
 * 2. Looks up the tenant slug for the project
 * 3. Creates a connection with search_path set to tenant_{tenant_slug}
 * 4. Returns a scoped pool that can be used for queries
 *
 * @param req - Next.js request object
 * @returns A schema-scoped pool
 * @throws Error if authentication fails or tenant not found
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const pool = await withSchemaScope(req);
 *   // All queries via this pool are scoped to tenant_{project_id}
 *   const result = await pool.query('SELECT * FROM users');
 *   return NextResponse.json({ data: result.rows });
 * }
 * ```
 */
export async function withSchemaScope(req: NextRequest): Promise<ScopedPool> {
  // Authenticate and get project_id from JWT
  const auth: JwtPayload = await authenticateRequest(req)
  const projectId = auth.project_id

  if (!projectId) {
    throw new Error(SchemaScopeError.MISSING_PROJECT_ID)
  }

  // Get tenant slug for this project
  const tenantSlug = await getTenantSlug(projectId)
  const schemaName = `tenant_${tenantSlug}`

  // Create a wrapper pool that sets search_path on connect
  const basePool = getPool()

  // Create a scoped pool that automatically sets search_path
  const scopedPool = new Proxy(basePool as Pool, {
    get(target, prop) {
      const value = (target as any)[prop]

      // Intercept query method to ensure search_path is set
      if (prop === 'query') {
        return async function (queryText: string, params?: any[]) {
          // Validate query doesn't attempt cross-schema access
          validateQueryIsolation(queryText, schemaName)

          // For simple queries, use a client from the pool with search_path set
          const client = await target.connect()
          try {
            await initSchemaScope(client, tenantSlug)
            const result = await client.query(queryText, params)
            return result
          } finally {
            client.release()
          }
        }
      }

      // Intercept connect method to return a scoped client
      if (prop === 'connect') {
        return async function () {
          const client = await target.connect()

          // Set search_path on the client
          await initSchemaScope(client, tenantSlug)

          // Return a scoped client wrapper
          const scopedClient: ScopedClient = Object.assign(client, {
            schemaName,
            projectId,
            tenantSlug,
          }) as ScopedClient

          return scopedClient
        }
      }

      return value
    },
  }) as ScopedPool

  // Add metadata to the scoped pool
  Object.assign(scopedPool, {
    schemaName,
    projectId,
    tenantSlug,
  })

  return scopedPool
}

/**
 * Get a schema-scoped client for the current request
 * Returns a client with search_path already set to tenant_{project_id}
 *
 * @param req - Next.js request object
 * @returns A schema-scoped database client
 * @throws Error if authentication fails or tenant not found
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const client = await getScopedClient(req);
 *   try {
 *     await client.query('BEGIN');
 *     await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
 *     await client.query('COMMIT');
 *     return NextResponse.json({ success: true });
 *   } finally {
 *     client.release();
 *   }
 * }
 * ```
 */
export async function getScopedClient(req: NextRequest): Promise<ScopedClient> {
  const pool = await withSchemaScope(req)
  return pool.connect() as Promise<ScopedClient>
}

/**
 * Higher-order function to wrap API route handlers with schema scoping
 * Automatically applies schema scope and provides it to the handler
 *
 * @param handler - The API route handler function
 * @returns A wrapped handler with schema scoping
 *
 * @example
 * ```typescript
 * import { withSchemaScopeHandler } from '@/lib/middleware/schema-scope';
 * import { NextRequest, NextResponse } from 'next/server';
 *
 * const handler = async (req: NextRequest, pool: ScopedPool) => {
 *   const result = await pool.query('SELECT * FROM users');
 *   return NextResponse.json({ data: result.rows });
 * };
 *
 * export const GET = withSchemaScopeHandler(handler);
 * ```
 */
export function withSchemaScopeHandler<T extends NextRequest>(
  handler: (req: T, pool: ScopedPool, ...args: any[]) => Promise<Response> | Response
): (req: T, ...args: any[]) => Promise<Response> {
  return async (req: T, ...args: any[]): Promise<Response> => {
    try {
      const pool = await withSchemaScope(req)
      const response = await handler(req, pool, ...args)
      return response
    } catch (error: any) {
      // Handle schema scoping errors using standard error factory
      if (error.message === SchemaScopeError.CROSS_SCHEMA_ACCESS) {
        return toErrorNextResponse(
          permissionDeniedError(
            'Access to other project resources not permitted',
            req.headers.get('x-project-id') || undefined
          )
        )
      }

      if (error.message === SchemaScopeError.TENANT_NOT_FOUND) {
        return toErrorNextResponse(
          notFoundError('The project tenant could not be found')
        )
      }

      if (error.message === SchemaScopeError.SCHEMA_INIT_FAILED) {
        return toErrorNextResponse(
          internalError('Failed to initialize database schema scope')
        )
      }

      // Re-throw other errors
      throw error
    }
  }
}

export { clearTenantSlugCache } from './cache'
export { validateQueryIsolation } from './validation'
export * from './types'
