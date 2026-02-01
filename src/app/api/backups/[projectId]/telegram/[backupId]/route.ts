/**
 * POST /api/backups/[projectId]/telegram/[backupId]
 *
 * Send a backup to Telegram.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enqueueJob } from '@nextmavenspacks/audit-logs-database';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; backupId: string } }
) {
  try {
    const developer = await authenticateRequest(request);
    const { projectId, backupId } = params;

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

    // Verify the backup belongs to this project
    const backupCheck = await pool.query(
      'SELECT id FROM control_plane.backups WHERE id = $1 AND project_id = $2',
      [backupId, projectId]
    );

    if (backupCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      );
    }

    const job = await enqueueJob(
      'send_to_telegram',
      {
        project_id: projectId,
        backup_id: backupId,
      },
      {
        project_id: projectId,
        max_attempts: 3,
      }
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Backup queued for sending to Telegram',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Backups API] Error sending to Telegram:', error);
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to process request. Please try again later.' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
