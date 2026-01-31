/**
 * GET /api/studio/[projectId]/tables/[table]/row-count
 *
 * Fetch row count for a specific table in a project's tenant schema.
 * US-010: Show Row Count (prd-schema-browser.json)
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

    // Query the row count for the table
    const countResult = await pool.query(
      `SELECT COUNT(*) as row_count
       FROM ${schemaName}.${table}`
    );

    const rowCount = parseInt(countResult.rows[0].row_count, 10);

    return NextResponse.json({ rowCount });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Studio] Fetch row count error:', error);

    const status =
      err.message === 'No token provided' ||
      err.message === 'Invalid token' ||
      err.message === 'Missing project_id claim'
        ? 401
        : 500;

    return NextResponse.json(
      { error: err.message || 'Failed to fetch row count' },
      { status }
    );
  }
}
