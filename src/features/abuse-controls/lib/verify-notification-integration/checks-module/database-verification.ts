/**
 * Verify Notification Integration - Checks Module - Database Verification
 */

import { checkTableExists, getTableIndexCount, createSuccessResult, createFailureResult, createErrorResult } from './utils'
import { DATABASE_TABLES } from './constants'
import type { VerificationResult } from '../types'

/**
 * Verify database tables exist
 */
export async function verifyDatabaseTables(): Promise<VerificationResult> {
  try {
    const tableChecks = await Promise.all(
      DATABASE_TABLES.map(async (table) => ({
        table,
        exists: await checkTableExists(table),
      }))
    )

    const missingTables = tableChecks.filter((t) => !t.exists)

    if (missingTables.length > 0) {
      return createFailureResult('Database Tables', 'Missing required database tables', {
        tables: tableChecks.reduce((acc, t) => ({ ...acc, [t.table]: t.exists ? 'exists' : 'missing' }), {}),
      })
    }

    const indexCount = await getTableIndexCount(DATABASE_TABLES)

    return createSuccessResult(
      'Database Tables',
      `Found ${DATABASE_TABLES.join(', ')} tables with ${indexCount} indexes`,
      { indexCount }
    )
  } catch (error) {
    return createErrorResult('Database Tables', error)
  }
}
