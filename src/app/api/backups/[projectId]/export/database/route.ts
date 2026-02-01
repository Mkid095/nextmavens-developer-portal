/**
 * POST /api/backups/[projectId]/export/database
 *
 * Export database backup for a project.
 * Creates a backup job and returns the job ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enqueueJob } from '@nextmavenspacks/audit-logs-database';
import { authenticateRequest } from '@/lib/middleware';
import { getPool } from '@/lib/db';
import { checkRateLimit, RateLimitIdentifierType } from '@/features/abuse-controls/lib/rate-limiter';

const EXPORT_RATE_LIMIT = 10; // 10 exports per hour
const EXPORT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(
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

    // Check rate limit
    const rateLimitResult = await checkRateLimit(
      {
        type: RateLimitIdentifierType.ORG,
        value: developer.id,
      },
      EXPORT_RATE_LIMIT,
      EXPORT_WINDOW_MS
    );

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many export requests. Please try again later.',
          retryAfter: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    const job = await enqueueJob(
      'export_backup',
      {
        project_id: projectId,
        format: 'sql',
        compress: true,
      },
      {
        project_id: projectId,
        max_attempts: 3,
      }
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Database export job queued successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Backups API] Error exporting database:', error);
    return NextResponse.json(
      { error: err.message === 'No token provided' ? 'Authentication required' : 'Failed to process request. Please try again later.' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    );
  }
}
