/**
 * GET /api/backups/[projectId]/stats
 *
 * Fetch backup statistics for a project.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@nextmavens/audit-logs-database';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(request);
    const { projectId } = params;

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

    const queryText = `
      SELECT
        COUNT(*) as total_backups,
        SUM(size) as total_size,
        COUNT(*) FILTER (WHERE type = 'database') as database_count,
        COUNT(*) FILTER (WHERE type = 'storage') as storage_count,
        COUNT(*) FILTER (WHERE type = 'logs') as logs_count,
        MIN(created_at) as oldest_backup,
        MAX(created_at) as newest_backup,
        COUNT(*) FILTER (WHERE expires_at <= NOW() + INTERVAL '7 days' AND expires_at > NOW()) as expiring_soon
      FROM control_plane.backups
      WHERE project_id = $1
    `;

    const result = await query(queryText, [projectId]);
    const row = result.rows[0];

    if (!row) {
      return NextResponse.json({
        total_backups: 0,
        total_size: 0,
        by_type: {
          database: 0,
          storage: 0,
          logs: 0,
        },
        expiring_soon: 0,
      });
    }

    return NextResponse.json({
      total_backups: parseInt(row.total_backups || '0', 10),
      total_size: parseInt(row.total_size || '0', 10),
      by_type: {
        database: parseInt(row.database_count || '0', 10),
        storage: parseInt(row.storage_count || '0', 10),
        logs: parseInt(row.logs_count || '0', 10),
      },
      oldest_backup: row.oldest_backup ? new Date(row.oldest_backup) : undefined,
      newest_backup: row.newest_backup ? new Date(row.newest_backup) : undefined,
      expiring_soon: parseInt(row.expiring_soon || '0', 10),
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Backups API] Error fetching backup stats:', error);
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to process request. Please try again later.' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
