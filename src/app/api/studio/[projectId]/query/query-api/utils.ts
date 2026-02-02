/**
 * SQL Query API - Utility Functions
 *
 * US-002: Create Execute Query API
 * US-007: Add Query Timeout
 * US-008: Show Query Stats
 * US-010: Enforce Database Write Permissions
 * US-011: Enforce Studio Permissions
 */

import { validationError } from '@/lib/errors'
import { DESTRUCTIVE_COMMANDS, WRITE_COMMANDS } from './constants'

/**
 * Extract the first SQL command from a query
 * Handles comments and whitespace
 */
export function extractSqlCommand(query: string): string {
  const trimmed = query.trim()

  // Remove SQL comments (both -- and /* */ style)
  const withoutComments = trimmed
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .trim()

  // Extract first word (the SQL command)
  const match = withoutComments.match(/^(\w+)/)
  return match ? match[1].toUpperCase() : ''
}

/**
 * Validate that a query doesn't contain destructive operations
 * when readonly mode is enabled
 */
export function validateReadonlyQuery(query: string): void {
  const command = extractSqlCommand(query)

  if (DESTRUCTIVE_COMMANDS.includes(command as any)) {
    throw validationError(
      `Destructive query not allowed in readonly mode: ${command} queries are prohibited. Uncheck readonly mode to execute this query.`,
      {
        command,
        readonlyMode: true,
      }
    )
  }
}

/**
 * Extract column names from a query result
 */
export function extractColumns(result: { rows: any[] }): string[] {
  if (result.rows.length === 0) {
    return []
  }
  return Object.keys(result.rows[0])
}

/**
 * Check if a query is a write operation (INSERT, UPDATE, DELETE)
 */
export function isWriteQuery(query: string): boolean {
  const command = extractSqlCommand(query)
  return WRITE_COMMANDS.includes(command as any)
}

/**
 * US-008: Check if a query is EXPLAIN or EXPLAIN ANALYZE
 */
export function isExplainQuery(query: string): boolean {
  const trimmed = query.trim().toUpperCase()
  return trimmed.startsWith('EXPLAIN ')
}

/**
 * US-008: Wrap query with EXPLAIN ANALYZE
 */
export function wrapWithExplain(query: string): string {
  return `EXPLAIN (VERBOSE, FORMAT JSON) ${query}`
}

/**
 * US-011: Check if a query is a read operation (SELECT)
 */
export function isReadQuery(query: string): boolean {
  const command = extractSqlCommand(query)
  return command === 'SELECT'
}

/**
 * Get organization ID (tenant_id) for a project
 */
export async function getOrganizationId(projectId: string): Promise<string> {
  const { getPool } = await import('@/lib/db')
  const pool = getPool()

  const result = await pool.query(
    `SELECT tenant_id FROM control_plane.projects WHERE id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    throw new Error('Project not found')
  }

  return result.rows[0].tenant_id
}

/**
 * US-007: Get query timeout for a project
 * Returns the configured timeout in milliseconds (default 30000ms = 30 seconds)
 */
export async function getQueryTimeout(projectId: string): Promise<number> {
  const { getPool } = await import('@/lib/db')
  const pool = getPool()

  const result = await pool.query(
    `SELECT query_timeout FROM control_plane.projects WHERE id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    // Default to 30 seconds if project not found
    return 30000
  }

  return result.rows[0].query_timeout || 30000
}

/**
 * US-007: Execute query with timeout
 * Uses Promise.race to enforce timeout on query execution
 */
export async function executeQueryWithTimeout(
  pool: any,
  query: string,
  timeoutMs: number
): Promise<any> {
  return Promise.race([
    pool.query(query),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Query timeout exceeded ${timeoutMs}ms. Consider optimizing your query or increasing the project's query_timeout setting.`
            )
          ),
        timeoutMs
      )
    ),
  ])
}

/**
 * US-008: Build response data from query result
 */
export function buildResponseData(
  result: any,
  trimmedQuery: string,
  queryToExecute: string,
  executionTime: number
): {
  columns: string[]
  rows: any[]
  rowCount: number
  executionTime: number
  rowsAffected?: number
  queryPlan?: any
} {
  const columns = extractColumns(result)
  const rows = result.rows

  const responseData: any = {
    columns,
    rows,
    rowCount: result.rowCount ?? rows.length,
    executionTime,
  }

  // US-008: Add rowsAffected for write operations
  if (isWriteQuery(trimmedQuery) && result.rowCount !== undefined) {
    responseData.rowsAffected = result.rowCount
  }

  // US-008: Add query plan for EXPLAIN queries
  if (isExplainQuery(queryToExecute) && rows.length > 0) {
    // PostgreSQL EXPLAIN (FORMAT JSON) returns JSON in the first row
    const queryPlanData = rows[0]['QUERY PLAN'] || rows[0]['query_plan'] || rows[0]
    try {
      responseData.queryPlan = typeof queryPlanData === 'string'
        ? JSON.parse(queryPlanData)
        : queryPlanData
    } catch {
      responseData.queryPlan = queryPlanData
    }
  }

  return responseData
}
