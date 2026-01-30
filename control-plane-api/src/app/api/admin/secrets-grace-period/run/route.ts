/**
 * Admin API: Secrets Grace Period Cleanup Job
 *
 * POST /api/admin/secrets-grace-period/run
 *
 * This endpoint triggers the background job that deletes old secret versions
 * after their grace period has expired (24 hours after rotation).
 *
 * This should be scheduled to run daily (e.g., via cron).
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSecretsGracePeriodJob, getSecretsGracePeriodStats } from '@/features/secrets-versioning';

export async function POST(req: NextRequest) {
  try {
    const startTime = new Date();

    // Get stats before running the job
    const beforeStats = await getSecretsGracePeriodStats();

    // Run the grace period cleanup job
    const result = await runSecretsGracePeriodJob();

    const duration = Date.now() - startTime.getTime();

    return NextResponse.json({
      success: result.success,
      deleted_count: result.deletedCount,
      deleted_secrets: result.deletedSecrets,
      duration_ms: duration,
      stats_before: beforeStats,
      error: result.error,
    });
  } catch (error) {
    console.error('Failed to run secrets grace period job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
