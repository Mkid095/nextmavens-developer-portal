/**
 * Write Log Utility
 *
 * Helper function to write log entries to the database.
 * This can be used throughout the application to log events.
 *
 * US-002: Create Logs WebSocket Endpoint
 */

import { getPool } from '@/lib/db'
import type { LogService, LogLevel, WriteLogOptions } from '../types'

/**
 * Write a log entry to the database
 *
 * @param options - Log write options
 * @returns The created log entry ID
 *
 * @example
 * ```ts
 * await writeLog({
 *   project_id: 'proj_123',
 *   service: 'database',
 *   level: 'info',
 *   message: 'Query executed successfully',
 *   metadata: { query: 'SELECT * FROM users', duration: '45ms' },
 *   request_id: 'req_abc123'
 * })
 * ```
 */
export async function writeLog(options: WriteLogOptions): Promise<string | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO control_plane.project_logs
        (project_id, service, level, message, metadata, request_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        options.project_id,
        options.service,
        options.level,
        options.message,
        options.metadata ? JSON.stringify(options.metadata) : '{}',
        options.request_id || null,
      ]
    )

    return result.rows[0].id
  } catch (error) {
    console.error('[Logs] Error writing log:', error)
    return null
  }
}

/**
 * Write an info log
 */
export async function logInfo(
  project_id: string,
  service: LogService,
  message: string,
  metadata?: Record<string, unknown>,
  request_id?: string
): Promise<string | null> {
  return writeLog({ project_id, service, level: 'info', message, metadata, request_id })
}

/**
 * Write a warning log
 */
export async function logWarn(
  project_id: string,
  service: LogService,
  message: string,
  metadata?: Record<string, unknown>,
  request_id?: string
): Promise<string | null> {
  return writeLog({ project_id, service, level: 'warn', message, metadata, request_id })
}

/**
 * Write an error log
 */
export async function logError(
  project_id: string,
  service: LogService,
  message: string,
  metadata?: Record<string, unknown>,
  request_id?: string
): Promise<string | null> {
  return writeLog({ project_id, service, level: 'error', message, metadata, request_id })
}
