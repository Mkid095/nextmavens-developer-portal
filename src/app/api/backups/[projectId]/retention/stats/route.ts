/**
 * GET /api/backups/[projectId]/retention/stats
 *
 * Get retention statistics for a project.
 * Returns metrics about backup retention including expiring backups,
 * pending notifications, and cleanup status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Authenticate request
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

    // Get retention statistics
    const config = {
      defaultRetentionDays: 30,
      notificationDays: 7,
    };

    // Query retention stats directly
    const statsQuery = `
      SELECT
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE expires_at <= NOW() + INTERVAL '7 days' AND expires_at > NOW()) as expiring_soon,
        COUNT(*) FILTER (WHERE notified_at IS NULL AND expires_at <= NOW() + INTERVAL '7 days') as pending_notification,
        COUNT(*) FILTER (WHERE expires_at < NOW() AND (cleanup_status IS NULL OR cleanup_status != 'deleted')) as pending_cleanup,
        COUNT(*) FILTER (WHERE cleanup_status = 'failed') as failed_cleanup,
        COALESCE(SUM(size), 0) as total_size_bytes
      FROM control_plane.backups
      WHERE project_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [projectId]);
    const statsRow = statsResult.rows[0];

    const stats = {
      total_backups: parseInt(statsRow.total_backups || '0', 10),
      expiring_soon: parseInt(statsRow.expiring_soon || '0', 10),
      pending_notification: parseInt(statsRow.pending_notification || '0', 10),
      pending_cleanup: parseInt(statsRow.pending_cleanup || '0', 10),
      failed_cleanup: parseInt(statsRow.failed_cleanup || '0', 10),
      total_size_bytes: parseInt(statsRow.total_size_bytes || '0', 10),
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Retention API] Error getting stats:', error);
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to get retention statistics' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
