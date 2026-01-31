/**
 * Admin API: Secrets Grace Period Warning Job
 *
 * POST /api/admin/secrets-warning/run
 *
 * This endpoint triggers the background job that sends warnings
 * for old secret versions that are about to expire (1 hour before).
 *
 * This should be scheduled to run hourly (e.g., via cron).
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSecretsWarningJob } from '@/features/secrets-versioning';

export async function POST(req: NextRequest) {
  try {
    const startTime = new Date();

    // Run the warning job
    const result = await runSecretsWarningJob();

    const duration = Date.now() - startTime.getTime();

    return NextResponse.json({
      success: result.success,
      warnings_sent: result.warningsSent,
      warned_secrets: result.warnedSecrets,
      duration_ms: duration,
      error: result.error,
    });
  } catch (error) {
    console.error('Failed to run secrets warning job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
