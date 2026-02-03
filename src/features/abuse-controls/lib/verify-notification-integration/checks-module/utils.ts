/**
 * Verify Notification Integration - Checks Module - Utilities
 */

import type { VerificationResult } from '../types'

/**
 * Create a successful verification result
 */
export function createSuccessResult(
  name: string,
  message: string,
  details?: Record<string, unknown>
): VerificationResult {
  return {
    name,
    passed: true,
    message,
    ...(details && { details }),
  }
}

/**
 * Create a failed verification result
 */
export function createFailureResult(
  name: string,
  message: string,
  details?: Record<string, unknown>
): VerificationResult {
  return {
    name,
    passed: false,
    message,
    ...(details && { details }),
  }
}

/**
 * Create an error verification result
 */
export function createErrorResult(
  name: string,
  error: unknown
): VerificationResult {
  return {
    name,
    passed: false,
    message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
  }
}

/**
 * Verify module exports required functions
 */
export async function verifyModuleFunctions(
  modulePath: string,
  requiredFunctions: readonly string[]
): Promise<{ missing: string[]; hasAll: boolean }> {
  try {
    const moduleExports = await import(modulePath)
    const missing: string[] = []

    for (const fn of requiredFunctions) {
      if (typeof (module as Record<string, unknown>)[fn] !== 'function') {
        missing.push(fn)
      }
    }

    return {
      missing,
      hasAll: missing.length === 0,
    }
  } catch {
    return {
      missing: requiredFunctions as string[],
      hasAll: false,
    }
  }
}

/**
 * Check if database table exists
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  const { getPool } = await import('@/lib/db')
  const pool = getPool()

  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = $1
    )
  `, [tableName])

  return result.rows[0].exists
}

/**
 * Get index count for tables
 */
export async function getTableIndexCount(tables: readonly string[]): Promise<number> {
  const { getPool } = await import('@/lib/db')
  const pool = getPool()

  const result = await pool.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = ANY($1)
  `, [tables])

  return result.rows.length
}
