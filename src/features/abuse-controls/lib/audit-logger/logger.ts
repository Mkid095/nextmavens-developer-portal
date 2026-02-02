/**
 * Audit Logger Module - Core Logger
 */

import { getPool } from '@/lib/db'
import type { AuditLogEntry, AuditLogLevel, AuditLogType } from './types'

/**
 * Log an audit entry to the database and console
 *
 * @param entry - The audit log entry to record
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  const pool = getPool()

  try {
    // Log to database for permanent record
    await pool.query(
      `
      INSERT INTO audit_logs (
        log_type,
        severity,
        project_id,
        developer_id,
        action,
        details,
        ip_address,
        user_agent,
        occurred_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        entry.log_type,
        entry.severity,
        entry.project_id || null,
        entry.developer_id || null,
        entry.action,
        JSON.stringify(entry.details),
        entry.ip_address || null,
        entry.user_agent || null,
        entry.occurred_at,
      ]
    )

    // Also log to console for immediate visibility
    const { AuditLogLevel } = await import('./types')
    const consoleMessage = `[Audit] ${entry.severity.toUpperCase()} ${entry.log_type}: ${entry.action}`
    const consoleDetails = {
      projectId: entry.project_id,
      developerId: entry.developer_id,
      ...entry.details,
    }

    switch (entry.severity) {
      case AuditLogLevel.CRITICAL:
        console.error(consoleMessage, consoleDetails)
        break
      case AuditLogLevel.ERROR:
        console.error(consoleMessage, consoleDetails)
        break
      case AuditLogLevel.WARNING:
        console.warn(consoleMessage, consoleDetails)
        break
      default:
        console.log(consoleMessage, consoleDetails)
    }
  } catch (error) {
    console.error('[Audit Logger] Failed to log audit entry:', error)
    // Don't throw - logging failure shouldn't break the application
  }
}
