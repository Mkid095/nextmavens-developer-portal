/**
 * Integration Verification for Abuse Controls
 *
 * This script verifies that the quota system is properly integrated
 * with the application database and API.
 */

import { getPool } from '@/lib/db'
import { createQuotasTable } from '../migrations/create-quotas-table'
import { applyDefaultQuotas } from './quotas'
import { HardCapType, DEFAULT_HARD_CAPS } from '../types'

/**
 * Verify that the quotas table exists and is properly configured
 */
export async function verifyQuotasTable(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  const pool = getPool()

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'project_quotas'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      return {
        success: false,
        message: 'project_quotas table does not exist',
      }
    }

    // Check table structure
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'project_quotas'
      ORDER BY ordinal_position
    `)

    const columns = columnsCheck.rows

    // Verify required columns exist
    const requiredColumns = [
      'id',
      'project_id',
      'cap_type',
      'cap_value',
      'created_at',
      'updated_at',
    ]

    const missingColumns = requiredColumns.filter(
      (col) => !columns.find((c: any) => c.column_name === col)
    )

    if (missingColumns.length > 0) {
      return {
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`,
        details: { existingColumns: columns.map((c: any) => c.column_name) },
      }
    }

    // Check indexes
    const indexesCheck = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'project_quotas'
    `)

    const indexes = indexesCheck.rows

    return {
      success: true,
      message: 'project_quotas table is properly configured',
      details: {
        columns: columns.map((c: any) => c.column_name),
        indexes: indexes.map((i: any) => i.indexname),
      },
    }
  } catch (error) {
    console.error('[Verification] Error verifying quotas table:', error)
    return {
      success: false,
      message: `Error verifying quotas table: ${(error as Error).message}`,
    }
  }
}

/**
 * Verify default quotas match requirements
 */
export function verifyDefaultQuotas(): {
  success: boolean
  message: string
  details?: any
} {
  const requiredQuotas = {
    [HardCapType.DB_QUERIES_PER_DAY]: 10_000,
    [HardCapType.REALTIME_CONNECTIONS]: 100,
    [HardCapType.STORAGE_UPLOADS_PER_DAY]: 1_000,
    [HardCapType.FUNCTION_INVOCATIONS_PER_DAY]: 5_000,
  }

  const mismatches: Array<{ type: string; expected: number; actual: number }> = []

  for (const [type, expectedValue] of Object.entries(requiredQuotas)) {
    const actualValue = DEFAULT_HARD_CAPS[type as HardCapType]

    if (actualValue !== expectedValue) {
      mismatches.push({
        type,
        expected: expectedValue,
        actual: actualValue,
      })
    }
  }

  if (mismatches.length > 0) {
    return {
      success: false,
      message: 'Default quotas do not match requirements',
      details: { mismatches },
    }
  }

  return {
    success: true,
    message: 'All default quotas match requirements',
    details: { quotas: requiredQuotas },
  }
}

/**
 * Test quota application to a project
 */
export async function testQuotaApplication(projectId: string): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  const pool = getPool()

  try {
    // Apply default quotas
    await applyDefaultQuotas(projectId)

    // Verify quotas were applied
    const quotaCheck = await pool.query(
      `
      SELECT cap_type, cap_value
      FROM project_quotas
      WHERE project_id = $1
      ORDER BY cap_type
      `,
      [projectId]
    )

    const quotas = quotaCheck.rows

    if (quotas.length !== 4) {
      return {
        success: false,
        message: `Expected 4 quotas, got ${quotas.length}`,
        details: { quotas },
      }
    }

    // Verify all quota types are present
    const expectedTypes = Object.values(HardCapType)
    const actualTypes = quotas.map((q: any) => q.cap_type)

    const missingTypes = expectedTypes.filter((type) => !actualTypes.includes(type))

    if (missingTypes.length > 0) {
      return {
        success: false,
        message: `Missing quota types: ${missingTypes.join(', ')}`,
        details: { quotas },
      }
    }

    return {
      success: true,
      message: 'Quotas successfully applied to project',
      details: { quotas },
    }
  } catch (error) {
    console.error('[Verification] Error testing quota application:', error)
    return {
      success: false,
      message: `Error testing quota application: ${(error as Error).message}`,
    }
  }
}

/**
 * Run all verification checks
 */
export async function runFullVerification(projectId?: string): Promise<{
  success: boolean
  checks: Array<{
    name: string
    success: boolean
    message: string
    details?: any
  }>
}> {
  const checks = []

  // Check 1: Verify quotas table
  const tableCheck = await verifyQuotasTable()
  checks.push({
    name: 'Quotas Table Verification',
    ...tableCheck,
  })

  // Check 2: Verify default quotas
  const defaultQuotasCheck = verifyDefaultQuotas()
  checks.push({
    name: 'Default Quotas Verification',
    ...defaultQuotasCheck,
  })

  // Check 3: Test quota application (if project ID provided)
  if (projectId) {
    const applicationCheck = await testQuotaApplication(projectId)
    checks.push({
      name: 'Quota Application Test',
      ...applicationCheck,
    })
  }

  const allPassed = checks.every((check) => check.success)

  return {
    success: allPassed,
    checks,
  }
}
