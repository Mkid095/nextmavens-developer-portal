/**
 * Database Schema Scoping Middleware
 *
 * Middleware for scoping database queries to tenant-specific schemas.
 * Enforces project isolation by setting search_path based on project_id.
 *
 * US-002: Scope Database Queries
 *
 * @example
 * ```typescript
 * import { withSchemaScope } from '@/lib/middleware/schema-scope';
 * import { NextRequest } from 'next/server';
 *
 * // In an API route
 * export async function GET(req: NextRequest) {
 *   const pool = await withSchemaScope(req);
 *   // All queries via this pool are scoped to tenant_{project_id}
 *   const result = await pool.query('SELECT * FROM users');
 *   return NextResponse.json({ data: result.rows });
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';
import { getPool } from '@/lib/db';
import { authenticateRequest, JwtPayload } from '@/lib/auth';

/**
 * Error codes for schema scoping
 */
export enum SchemaScopeError {
  MISSING_PROJECT_ID = 'MISSING_PROJECT_ID',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  CROSS_SCHEMA_ACCESS = 'CROSS_SCHEMA_ACCESS',
  SCHEMA_INIT_FAILED = 'SCHEMA_INIT_FAILED',
}

/**
 * Schema-scoped pool wrapper
 * Extends Pool to include schema metadata
 */
export interface ScopedPool extends Pool {
  schemaName: string;
  projectId: string;
  tenantSlug: string;
}

/**
 * Schema-scoped client wrapper
 * Extends PoolClient to include schema metadata
 */
export interface ScopedClient extends PoolClient {
  schemaName: string;
  projectId: string;
  tenantSlug: string;
}

/**
 * Cache for tenant slug lookups
 * Maps project_id -> tenant_slug
 */
const tenantSlugCache = new Map<string, string>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Cache entry with timestamp
 */
interface CacheEntry {
  slug: string;
  timestamp: number;
}

/**
 * Get tenant slug for a project
 * Uses cache to avoid repeated database queries
 *
 * @param projectId - The project ID
 * @returns The tenant slug
 * @throws Error if tenant not found
 */
async function getTenantSlug(projectId: string): Promise<string> {
  // Check cache first
  const cached = tenantSlugCache.get(projectId) as CacheEntry | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.slug;
  }

  // Query database for tenant slug
  const pool = getPool();
  const result = await pool.query(
    `SELECT t.slug as tenant_slug
     FROM projects p
     JOIN tenants t ON p.tenant_id = t.id
     WHERE p.id = $1`,
    [projectId]
  );

  if (result.rows.length === 0) {
    throw new Error(SchemaScopeError.TENANT_NOT_FOUND);
  }

  const tenantSlug = result.rows[0].tenant_slug;

  // Cache the result
  tenantSlugCache.set(projectId, {
    slug: tenantSlug,
    timestamp: Date.now(),
  });

  return tenantSlug;
}

/**
 * Validate that a query doesn't attempt cross-schema access
 * Checks for schema-qualified table names that don't match the expected schema
 *
 * @param query - The SQL query to validate
 * @param expectedSchema - The expected schema name
 * @throws Error if cross-schema access detected
 */
export function validateQueryIsolation(query: string, expectedSchema: string): void {
  // Pattern to match schema-qualified table names: schema_name.table_name
  // Matches: public.users, other_schema.table, "schema"."table"
  const schemaPattern = /["']?[\w]+["']?\.["']?[\w]+["']?/g;

  const matches = query.match(schemaPattern);
  if (!matches) {
    return; // No schema-qualified names, safe to proceed
  }

  for (const match of matches) {
    // Extract schema name from the match
    const parts = match.split('.');
    if (parts.length >= 2) {
      let schemaName = parts[0].replace(/["']/g, '');

      // Check if it's a cross-schema reference
      // Allow: public (for system tables), information_schema (for metadata), pg_catalog (PostgreSQL system)
      const allowedSchemas = ['public', 'information_schema', 'pg_catalog', 'pg_temp', expectedSchema];

      if (!allowedSchemas.includes(schemaName)) {
        throw new Error(SchemaScopeError.CROSS_SCHEMA_ACCESS);
      }
    }
  }
}

/**
 * Initialize schema scope for a connection
 * Sets search_path to tenant_{tenant_slug}
 *
 * @param client - The database client
 * @param tenantSlug - The tenant slug
 * @throws Error if schema init fails
 */
async function initSchemaScope(client: PoolClient, tenantSlug: string): Promise<void> {
  const schemaName = `tenant_${tenantSlug}`;

  try {
    // Set search_path for this connection
    await client.query(`SET search_path TO ${schemaName}, public`);
  } catch (error) {
    console.error('[Schema Scope] Failed to set search_path:', error);
    throw new Error(SchemaScopeError.SCHEMA_INIT_FAILED);
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
  const auth: JwtPayload = await authenticateRequest(req);
  const projectId = auth.project_id;

  if (!projectId) {
    throw new Error(SchemaScopeError.MISSING_PROJECT_ID);
  }

  // Get tenant slug for this project
  const tenantSlug = await getTenantSlug(projectId);
  const schemaName = `tenant_${tenantSlug}`;

  // Create a wrapper pool that sets search_path on connect
  const basePool = getPool();

  // Create a scoped pool that automatically sets search_path
  const scopedPool = new Proxy(basePool as Pool, {
    get(target, prop) {
      const value = (target as any)[prop];

      // Intercept query method to ensure search_path is set
      if (prop === 'query') {
        return async function (queryText: string, params?: any[]) {
          // Validate query doesn't attempt cross-schema access
          validateQueryIsolation(queryText, schemaName);

          // For simple queries, use a client from the pool with search_path set
          const client = await target.connect();
          try {
            await initSchemaScope(client, tenantSlug);
            const result = await client.query(queryText, params);
            return result;
          } finally {
            client.release();
          }
        };
      }

      // Intercept connect method to return a scoped client
      if (prop === 'connect') {
        return async function () {
          const client = await target.connect();

          // Set search_path on the client
          await initSchemaScope(client, tenantSlug);

          // Return a scoped client wrapper
          const scopedClient: ScopedClient = Object.assign(client, {
            schemaName,
            projectId,
            tenantSlug,
          }) as ScopedClient;

          return scopedClient;
        };
      }

      return value;
    },
  }) as ScopedPool;

  // Add metadata to the scoped pool
  Object.assign(scopedPool, {
    schemaName,
    projectId,
    tenantSlug,
  });

  return scopedPool;
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
  const pool = await withSchemaScope(req);
  return pool.connect() as Promise<ScopedClient>;
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
  handler: (req: T, pool: ScopedPool) => Promise<Response> | Response
): (req: T, ...args: any[]) => Promise<NextResponse> {
  return async (req: T, ...args: any[]): Promise<NextResponse> => {
    try {
      const pool = await withSchemaScope(req);
      const response = await handler(req, pool, ...args);
      return response as NextResponse;
    } catch (error: any) {
      // Handle schema scoping errors
      if (error.message === SchemaScopeError.CROSS_SCHEMA_ACCESS) {
        return NextResponse.json(
          {
            error: 'Cross-schema access denied',
            message: 'Access to other project resources not permitted',
          },
          { status: 403 }
        );
      }

      if (error.message === SchemaScopeError.TENANT_NOT_FOUND) {
        return NextResponse.json(
          {
            error: 'Tenant not found',
            message: 'The project tenant could not be found',
          },
          { status: 404 }
        );
      }

      if (error.message === SchemaScopeError.SCHEMA_INIT_FAILED) {
        return NextResponse.json(
          {
            error: 'Schema initialization failed',
            message: 'Failed to initialize database schema scope',
          },
          { status: 500 }
        );
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Clear the tenant slug cache
 * Useful for testing or when tenant data changes
 */
export function clearTenantSlugCache(): void {
  tenantSlugCache.clear();
}

/**
 * Type augmentation for Pool to include scope metadata
 */
declare module 'pg' {
  interface Pool {
    schemaName?: string;
    projectId?: string;
    tenantSlug?: string;
  }

  interface PoolClient {
    schemaName?: string;
    projectId?: string;
    tenantSlug?: string;
  }
}

export default withSchemaScope;
