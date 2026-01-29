/**
 * POST /api/backups/[projectId]/retention/cleanup
 *
 * Trigger manual cleanup of expired backups for a project.
 * This is an admin endpoint for manually triggering cleanup.
 *
 * SECURITY:
 * - Rate limited: 3 requests per hour per project (prevents abuse)
 * - Requires project ownership verification
 * - Returns minimal information to prevent data leakage
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';
import {
  checkRateLimit,
  extractClientIP,
  RateLimitIdentifierType,
} from '@/features/abuse-controls/lib/rate-limiter';

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

    // SECURITY: Rate limit cleanup operations to prevent abuse
    // Limit: 3 cleanup requests per hour per project
    const rateLimitResult = await checkRateLimit(
      {
        type: RateLimitIdentifierType.ORG,
        value: projectId,
      },
      3, // 3 requests per hour
      60 * 60 * 1000 // 1 hour window
    );

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.max(0, Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: 'Too many cleanup requests. Please try again later.',
          retryAfter: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remainingAttempts.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
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

      // SECURITY: Return minimal information to prevent data leakage
      return NextResponse.json({
        success: true,
        dry_run: true,
        would_delete: eligibleResult.rows.length,
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
