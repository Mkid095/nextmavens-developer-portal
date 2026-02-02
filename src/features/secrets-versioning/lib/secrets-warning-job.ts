/**
 * Secrets Grace Period Warning Job
 *
 * Implements US-006: Grace Period for Old Secrets
 * - Sends warnings 1 hour before old secret versions expire
 * - Logs warning to audit trail
 */

import { getPool } from '@/lib/db';
import { logAuditEntry, AuditTargetType, AuditActorType } from '@/lib/audit-logger';

interface GracePeriodWarningResult {
  success: boolean;
  warningsSent: number;
  warnedSecrets: Array<{
    id: string;
    name: string;
    version: number;
    project_id: string;
    expires_at: string;
  }>;
  error?: string;
}

/**
 * Main job function to send warnings for secrets about to expire
 * Finds all secret versions where grace_period_ends_at is within 1 hour
 * and warning hasn't been sent yet
 */
export async function runSecretsWarningJob(): Promise<GracePeriodWarningResult> {
  const startTime = new Date();
  const warnedSecrets: Array<{
    id: string;
    name: string;
    version: number;
    project_id: string;
    expires_at: string;
  }> = [];

  try {
    const pool = getPool();

    // Find secrets that need warnings:
    // - Grace period ends within 1 hour
    // - Warning hasn't been sent yet
    // - Not the active version (it's an old version)
    const selectQuery = `
      SELECT id, project_id, name, version, grace_period_ends_at
      FROM control_plane.secrets
      WHERE grace_period_ends_at IS NOT NULL
        AND grace_period_warning_sent_at IS NULL
        AND active = FALSE
        AND grace_period_ends_at > NOW()
        AND grace_period_ends_at <= NOW() + INTERVAL '1 hour'
      ORDER BY grace_period_ends_at ASC
    `;

    const selectResult = await pool.query(selectQuery);

    if (selectResult.rows.length === 0) {
      return {
        success: true,
        warningsSent: 0,
        warnedSecrets: [],
      };
    }

    // Send warnings and mark as sent
    for (const row of selectResult.rows) {
      try {
        // Log the warning to audit trail
        // This serves as the "warning" - in production, this could trigger
        // webhooks, notifications, or emails
        await logAuditEntry({
          actor_type: AuditActorType.SYSTEM,
          actor_id: 'secrets-warning-job',
          action: 'secret.grace_period_warning',
          target_type: AuditTargetType.SECRET,
          target_id: row.id,
          project_id: row.project_id,
          metadata: {
            secret_name: row.name,
            version: row.version,
            expires_at: row.grace_period_ends_at,
            time_until_expiration: Math.floor(
              (new Date(row.grace_period_ends_at).getTime() - startTime.getTime()) / 60000
            ), // minutes
            warning_message: 'Old secret version will be deleted after grace period expires. Ensure all consumers have updated to the new version.',
            job_started_at: startTime.toISOString(),
          },
        });

        // Mark warning as sent
        await pool.query(
          `UPDATE control_plane.secrets
           SET grace_period_warning_sent_at = NOW()
           WHERE id = $1`,
          [row.id]
        );

        warnedSecrets.push({
          id: row.id,
          name: row.name,
          version: row.version,
          project_id: row.project_id,
          expires_at: row.grace_period_ends_at,
        });
      } catch (err) {
        // Log error but continue with other secrets
        console.error(`Failed to send warning for secret ${row.id}:`, err);
      }
    }

    return {
      success: true,
      warningsSent: warnedSecrets.length,
      warnedSecrets,
    };
  } catch (error) {
    console.error('Secrets warning job failed:', error);
    return {
      success: false,
      warningsSent: 0,
      warnedSecrets,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get secrets that are currently in grace period
 * Useful for monitoring and dashboards
 */
export async function getSecretsInGracePeriod(projectId?: string) {
  const query = projectId
    ? `
      SELECT
        s.id,
        s.project_id,
        s.name,
        s.version,
        s.grace_period_ends_at,
        s.grace_period_warning_sent_at,
        s.created_at,
        p.name as project_name,
        (
          SELECT COUNT(*)
          FROM control_plane.secret_consumers sc
          WHERE sc.secret_id = s.id
        ) as consumer_count
      FROM control_plane.secrets s
      JOIN projects p ON s.project_id = p.id
      WHERE s.grace_period_ends_at IS NOT NULL
        AND s.active = FALSE
        AND s.grace_period_ends_at > NOW()
        AND s.project_id = $1
      ORDER BY s.grace_period_ends_at ASC
    `
    : `
      SELECT
        s.id,
        s.project_id,
        s.name,
        s.version,
        s.grace_period_ends_at,
        s.grace_period_warning_sent_at,
        s.created_at,
        p.name as project_name,
        (
          SELECT COUNT(*)
          FROM control_plane.secret_consumers sc
          WHERE sc.secret_id = s.id
        ) as consumer_count
      FROM control_plane.secrets s
      JOIN projects p ON s.project_id = p.id
      WHERE s.grace_period_ends_at IS NOT NULL
        AND s.active = FALSE
        AND s.grace_period_ends_at > NOW()
      ORDER BY s.grace_period_ends_at ASC
    `;

  const result = projectId
    ? await pool.query(query, [projectId])
    : await pool.query(query);

  return result.rows;
}
