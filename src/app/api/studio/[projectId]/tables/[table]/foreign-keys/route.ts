/**
 * GET /api/studio/[projectId]/tables/[table]/foreign-keys
 *
 * Fetch foreign keys for a specific table in a project's tenant schema.
 * US-007: Fetch Foreign Keys (prd-schema-browser.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, type JwtPayload } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; table: string }> }
) {
  try {
    // Authenticate the request - JWT contains project_id claim
    const auth: JwtPayload = await authenticateRequest(req);
    const { projectId, table } = await params;

    // Verify the project_id in JWT matches the requested projectId
    if (auth.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Project ID mismatch' },
        { status: 403 }
      );
    }

    // Validate table name (prevent SQL injection)
    if (!table || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Get project info with tenant slug
    const projectResult = await pool.query(
      `SELECT p.id, t.slug as tenant_slug
       FROM projects p
       JOIN tenants t ON p.tenant_id = t.id
       WHERE p.id = $1 AND p.developer_id = $2`,
      [projectId, auth.id]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const tenantSlug = projectResult.rows[0].tenant_slug;
    const schemaName = `tenant_${tenantSlug}`;

    // Verify the table exists in the tenant schema
    const tableCheckResult = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1
       AND table_name = $2
       AND table_type = 'BASE TABLE'`,
      [schemaName, table]
    );

    if (tableCheckResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Query foreign keys by joining information_schema.table_constraints
    // with information_schema.key_column_usage
    // We need to get both the local column and the referenced table/column
    const foreignKeysResult = await pool.query(
      `SELECT
         tc.constraint_name,
         kcu.column_name,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = $1
       AND tc.table_name = $2
       ORDER BY tc.constraint_name, kcu.ordinal_position`,
      [schemaName, table]
    );

    const foreignKeys = foreignKeysResult.rows.map(row => ({
      constraint_name: row.constraint_name,
      column_name: row.column_name,
      foreign_table: row.foreign_table_name,
      foreign_column: row.foreign_column_name,
    }));

    return NextResponse.json({ foreignKeys });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Studio] Fetch foreign keys error:', error);

    const status =
      err.message === 'No token provided' ||
      err.message === 'Invalid token' ||
      err.message === 'Missing project_id claim'
        ? 401
        : 500;

    return NextResponse.json(
      { error: err.message || 'Failed to fetch foreign keys' },
      { status }
    );
  }
}
