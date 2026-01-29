/**
 * GET /api/backups/[projectId]
 *
 * Fetch backups for a project.
 * Returns paginated list of backups with filtering options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@nextmavens/audit-logs-database';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';

const VALID_BACKUP_TYPES = ['database', 'storage', 'logs'];

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(request);
    const { projectId } = params;
    const searchParams = request.nextUrl.searchParams;

    // Verify developer owns this project
    const pool = getPool();
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const type = searchParams.get('type');
    const limitParam = searchParams.get('limit') || '50';
    const offsetParam = searchParams.get('offset') || '0';

    // Validate input parameters
    const limit = parseInt(limitParam, 10);
    const offset = parseInt(offsetParam, 10);

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 100.' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter. Must be a non-negative number.' },
        { status: 400 }
      );
    }

    if (type && !VALID_BACKUP_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid backup type.' },
        { status: 400 }
      );
    }

    let queryText = `
      SELECT
        id,
        project_id,
        type,
        file_id,
        size,
        created_at,
        expires_at
      FROM control_plane.backups
      WHERE project_id = $1
    `;

    const values: (string | number)[] = [projectId];
    let paramIndex = 2;

    if (type) {
      queryText += ` AND type = $${paramIndex++}`;
      values.push(type);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM control_plane.backups
      WHERE project_id = $1
      ${type ? `AND type = $2` : ''}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(queryText, values),
      query(countQuery, type ? [projectId, type] : [projectId]),
    ]);

    const countRow = countResult.rows[0];
    const total = parseInt(countRow?.total || '0', 10);
    const hasMore = offset + limit < total;

    return NextResponse.json({
      data: dataResult.rows,
      total,
      limit,
      offset,
      has_more: hasMore,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Backups API] Error fetching backups:', error);
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to process request. Please try again later.' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
