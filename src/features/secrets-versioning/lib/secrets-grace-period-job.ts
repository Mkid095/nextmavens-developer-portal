/**
 * Secrets Grace Period Cleanup Job
 *
 * Implements US-006: Grace Period for Old Secrets
 * - Deletes old secret versions after their grace period ends (24 hours after rotation)
 * - Logs deletion to audit trail
 */

import { getPool } from '@/lib/db';
import { logAuditEntry, AuditTargetType, AuditActorType } from '@/lib/audit-logger';

interface GracePeriodCleanupResult {
  success: boolean;
  deletedCount: number;
  deletedSecrets: Array<{ id: string; name: string; version: number; project_id: string }>;
  error?: string;
}

/**
 * Main job function to clean up expired secrets
 * Finds all secret versions where grace_period_ends_at < NOW() and deletes them
 */
export async function runSecretsGracePeriodJob(): Promise<GracePeriodCleanupResult> {
  const startTime = new Date();
  const deletedSecrets: Array<{ id: string; name: string; version: number; project_id: string }> = [];

  try {
    const pool = getPool();

    // Find all secrets that have expired grace periods
    // These are old versions (active = FALSE) where grace_period_ends_at has passed
    const selectQuery = `
      SELECT id, project_id, name, version
      FROM control_plane.secrets
      WHERE grace_period_ends_at IS NOT NULL
        AND grace_period_ends_at < NOW()
        AND active = FALSE
      ORDER BY grace_period_ends_at ASC
    `;

    const selectResult = await pool.query(selectQuery);

    if (selectResult.rows.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        deletedSecrets: [],
      };
    }

    // Delete each expired secret version
    for (const row of selectResult.rows) {
      try {
        await pool.query(
          'DELETE FROM control_plane.secrets WHERE id = $1',
          [row.id]
        );

        // Log the deletion to audit trail
        await logAuditEntry({
          actor_type: AuditActorType.SYSTEM,
          actor_id: 'secrets-grace-period-job',
          action: 'secret.grace_period_deleted',
          target_type: AuditTargetType.SECRET,
          target_id: row.id,
          project_id: row.project_id,
          metadata: {
            secret_name: row.name,
            version: row.version,
            reason: 'grace_period_expired',
            job_started_at: startTime.toISOString(),
          },
        });

        deletedSecrets.push({
          id: row.id,
          name: row.name,
          version: row.version,
          project_id: row.project_id,
        });
      } catch (err) {
        // Log error but continue with other secrets
        console.error(`Failed to delete secret ${row.id}:`, err);
      }
    }

    return {
      success: true,
      deletedCount: deletedSecrets.length,
      deletedSecrets,
    };
  } catch (error) {
    console.error('Secrets grace period job failed:', error);
    return {
      success: false,
      deletedCount: 0,
      deletedSecrets,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get statistics about secrets in grace period
 * Useful for monitoring and alerting
 */
export async function getSecretsGracePeriodStats() {
  const pool = getPool();
  const query = `
    SELECT
      COUNT(*) FILTER (WHERE grace_period_ends_at IS NOT NULL AND active = FALSE) as in_grace_period,
      COUNT(*) FILTER (WHERE grace_period_ends_at IS NOT NULL AND active = FALSE AND grace_period_ends_at < NOW()) as expired,
      COUNT(*) FILTER (WHERE grace_period_ends_at IS NOT NULL AND active = FALSE AND grace_period_ends_at > NOW() AND grace_period_ends_at < NOW() + INTERVAL '1 hour') as expiring_soon,
      COUNT(*) FILTER (WHERE grace_period_ends_at IS NOT NULL AND active = FALSE AND grace_period_warning_sent_at IS NULL AND grace_period_ends_at < NOW() + INTERVAL '1 hour') as pending_warnings
    FROM control_plane.secrets
  `;

  const result = await pool.query(query);
  return result.rows[0];
}
