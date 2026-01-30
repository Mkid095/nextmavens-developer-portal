/**
 * GET /api/studio/[projectId]/tables
 *
 * Fetch tables list for a project's tenant schema.
 * US-002: Fetch Tables List
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, type JwtPayload } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Authenticate the request - JWT contains project_id claim
    const auth: JwtPayload = await authenticateRequest(req);
    const { projectId } = params;

    // Verify the project_id in JWT matches the requested projectId
    if (auth.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Project ID mismatch' },
        { status: 403 }
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

    // Query information_schema.tables for the tenant schema
    const tablesResult = await pool.query(
      `SELECT table_name, created_at
       FROM information_schema.tables
       WHERE table_schema = $1
       AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [schemaName]
    );

    const tables = tablesResult.rows.map(row => ({
      table_name: row.table_name,
      created_at: row.created_at,
    }));

    return NextResponse.json({ tables });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Studio] Fetch tables error:', error);

    const status =
      err.message === 'No token provided' ||
      err.message === 'Invalid token' ||
      err.message === 'Missing project_id claim'
        ? 401
        : 500;

    return NextResponse.json(
      { error: err.message || 'Failed to fetch tables' },
      { status }
    );
  }
}
