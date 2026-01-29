/**
 * POST /api/backups/[projectId]/retention/notify
 *
 * Send expiration notifications for backups nearing expiration.
 * This is an admin endpoint for manually triggering notifications.
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

    // Validate batch_size
    if (batchSize < 1 || batchSize > 1000) {
      return NextResponse.json(
        { error: 'Invalid batch_size. Must be between 1 and 1000.' },
        { status: 400 }
      );
    }

    // Mark backups as notified
    const notificationThreshold = new Date();
    notificationThreshold.setDate(notificationThreshold.getDate() + 7); // 7 days

    const notifyQuery = `
      UPDATE control_plane.backups
      SET
        notified_at = NOW(),
        cleanup_status = 'notified'
      WHERE project_id = $1
        AND expires_at <= $2
        AND expires_at > NOW()
        AND notified_at IS NULL
      RETURNING id, type, expires_at
    `;
    const notifyResult = await pool.query(notifyQuery, [projectId, notificationThreshold]);

    const result = {
      successful: notifyResult.rows.length,
      failed: 0,
      notified_at: new Date(),
      errors: [],
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Retention API] Error sending notifications:', error);
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to send notifications' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
