/**
 * POST /api/backups/[projectId]/retention/cleanup
 *
 * Trigger manual cleanup of expired backups for a project.
 * This is an admin endpoint for manually triggering cleanup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';

export async function POST(
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

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const batchSize = typeof body.batch_size === 'number' ? body.batch_size : 100;
    const dryRun = typeof body.dry_run === 'boolean' ? body.dry_run : false;

    // Validate batch_size
    if (batchSize < 1 || batchSize > 1000) {
      return NextResponse.json(
        { error: 'Invalid batch_size. Must be between 1 and 1000.' },
        { status: 400 }
      );
    }

    if (dryRun) {
      // Dry run - just report what would be deleted
      const eligibleQuery = `
        SELECT id, type, expires_at
        FROM control_plane.backups
        WHERE project_id = $1
          AND expires_at < NOW()
          AND (cleanup_status IS NULL OR cleanup_status != 'deleted')
        ORDER BY expires_at ASC
        LIMIT $2
      `;
      const eligibleResult = await pool.query(eligibleQuery, [projectId, batchSize]);

      return NextResponse.json({
        success: true,
        dry_run: true,
        would_delete: eligibleResult.rows.length,
        backups: eligibleResult.rows,
      });
    }

    // Execute cleanup
    // Delete from database (Telegram deletion is handled separately)
    const deleteQuery = `
      DELETE FROM control_plane.backups
      WHERE project_id = $1
        AND expires_at < NOW()
        AND (cleanup_status IS NULL OR cleanup_status != 'deleted')
      RETURNING id, type, file_id, message_id
    `;
    const deleteResult = await pool.query(deleteQuery, [projectId]);

    // Note: Telegram message deletion would need to be done via telegram-service API
    // For now, we log that messages need to be deleted
    console.log(`[Retention Cleanup] Deleted ${deleteResult.rows.length} backups from database`);
    console.log(`[Retention Cleanup] TODO: Delete ${deleteResult.rows.filter((r: unknown) => (r as any).message_id).length} messages from Telegram`);

    const result = {
      successful: deleteResult.rows.length,
      failed: 0,
      skipped: 0,
      duration_ms: 0,
      errors: [],
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Retention API] Error triggering cleanup:', error);
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to trigger cleanup' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
