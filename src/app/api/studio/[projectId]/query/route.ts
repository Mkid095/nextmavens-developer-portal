/**
 * SQL Query Execution API
 *
 * US-002: Create Execute Query API
 * US-010: Enforce Database Write Permissions
 *
 * Executes SQL queries on tenant-specific schemas with readonly mode protection.
 * Validates queries for destructive operations when readonly mode is enabled.
 * Checks database.write permission for non-readonly queries (INSERT/UPDATE/DELETE).
 *
 * POST /api/studio/:projectId/query
 *
 * Request body:
 * {
 *   "query": "SELECT * FROM users LIMIT 10",
 *   "readonly": true
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "columns": ["id", "name", "email"],
 *     "rows": [{ "id": 1, "name": "John", "email": "john@example.com" }],
 *     "rowCount": 1,
 *     "executionTime": 45
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSchemaScope, ScopedPool } from '@/lib/middleware/schema-scope'
import { authenticateRequest } from '@/lib/auth'
import { checkUserPermission } from '@/lib/rbac'
import { Permission } from '@/lib/types/rbac.types'
import {
  validationError,
  toErrorNextResponse,
  ErrorCode,
  permissionDeniedError,
} from '@/lib/errors'

/**
 * Destructive SQL commands that modify data
 * Used to validate readonly mode
 */
const DESTRUCTIVE_COMMANDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'RENAME',
  'GRANT',
  'REVOKE',
  'COMMENT',
] as const

/**
 * Extract the first SQL command from a query
 * Handles comments and whitespace
 */
function extractSqlCommand(query: string): string {
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
function validateReadonlyQuery(query: string): void {
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
function extractColumns(result: { rows: any[] }): string[] {
  if (result.rows.length === 0) {
    return []
  }
  return Object.keys(result.rows[0])
}

/**
 * Check if a query is a write operation (INSERT, UPDATE, DELETE)
 */
function isWriteQuery(query: string): boolean {
  const command = extractSqlCommand(query)
  return ['INSERT', 'UPDATE', 'DELETE'].includes(command)
}

/**
 * Get organization ID (tenant_id) for a project
 */
async function getOrganizationId(projectId: string): Promise<string> {
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
 * POST /api/studio/:projectId/query
 *
 * Execute SQL queries on the tenant-specific schema
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await req.json()
    const { query, readonly = true } = body as {
      query?: string
      readonly?: boolean
    }

    // Validate query exists
    if (!query || typeof query !== 'string') {
      throw validationError('Query is required and must be a string', {
        received: typeof query,
      })
    }

    // Validate query is not empty
    const trimmedQuery = query.trim()
    if (trimmedQuery.length === 0) {
      throw validationError('Query cannot be empty')
    }

    // Validate readonly mode
    if (readonly) {
      validateReadonlyQuery(trimmedQuery)
    }

    // US-010: Check database.write permission for write operations
    // If readonly is false and query is a write operation, check permission
    if (!readonly && isWriteQuery(trimmedQuery)) {
      // Authenticate request to get user ID
      const user = await authenticateRequest(req)

      // Get organization ID from project
      const organizationId = await getOrganizationId(params.projectId)

      // Check database.write permission
      const permissionResult = await checkUserPermission(
        { id: user.id },
        organizationId,
        Permission.DATABASE_WRITE
      )

      if (!permissionResult.granted) {
        throw permissionDeniedError(
          `You do not have permission to perform write operations on the database. ` +
          `Your role '${permissionResult.role}' does not have the 'database.write' permission. ` +
          `Please contact your organization owner to request this permission.`,
          {
            required_permission: 'database.write',
            your_role: permissionResult.role,
            query_type: extractSqlCommand(trimmedQuery),
          }
        )
      }
    }

    // Get schema-scoped pool
    const pool = await withSchemaScope(req)

    // Execute query
    const result = await pool.query(trimmedQuery)

    // Calculate execution time
    const executionTime = Date.now() - startTime

    // Extract columns and rows
    const columns = extractColumns(result)
    const rows = result.rows

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        columns,
        rows,
        rowCount: result.rowCount ?? rows.length,
        executionTime,
      },
    })
  } catch (error: any) {
    // Handle validation errors with custom context
    if (error.code === ErrorCode.VALIDATION_ERROR) {
      return error.toNextResponse()
    }

    // Handle all other errors
    return toErrorNextResponse(error, params.projectId)
  }
}

/**
 * GET /api/studio/:projectId/query
 *
 * Return information about the query API (not query execution)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/studio/:projectId/query',
    method: 'POST',
    description: 'Execute SQL queries on tenant-specific schema',
    requestBody: {
      query: 'SQL query string (required)',
      readonly: 'Boolean flag to prevent destructive queries (default: true)',
    },
    response: {
      success: 'true if query executed successfully',
      data: {
        columns: 'Array of column names from result',
        rows: 'Array of row objects',
        rowCount: 'Number of rows returned/affected',
        executionTime: 'Query execution time in milliseconds',
      },
    },
    destructiveCommands: Array.from(DESTRUCTIVE_COMMANDS),
  })
}
