/**
 * SQL Query API - HTTP Handlers
 *
 * US-002: Create Execute Query API
 * US-007: Add Query Timeout
 * US-008: Show Query Stats
 * US-010: Enforce Database Write Permissions
 * US-011: Enforce Studio Permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSchemaScope } from '@/lib/middleware/schema-scope'
import { authenticateRequest } from '@/lib/auth'
import { checkUserPermission } from '@/lib/rbac'
import { Permission } from '@/lib/types/rbac.types'
import { validationError, toErrorNextResponse, ErrorCode } from '@/lib/errors'
import { DESTRUCTIVE_COMMANDS, HTTP_STATUS, ERROR_CODES } from './constants'
import type { QueryRequestBody, QuerySuccessResponse } from './types'
import {
  validateReadonlyQuery,
  getOrganizationId,
  getQueryTimeout,
  executeQueryWithTimeout,
  isReadQuery,
  isWriteQuery,
  isExplainQuery,
  wrapWithExplain,
  buildResponseData,
} from './utils'

/**
 * Parse and validate request body
 */
function parseRequestBody(body: unknown): { query: string; readonly: boolean; explain: boolean; trimmedQuery: string } {
  const { query, readonly = true, explain = false } = body as Partial<QueryRequestBody>

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

  return { query, readonly, explain, trimmedQuery }
}

/**
 * Check database permissions based on query type
 */
async function checkDatabasePermissions(
  user: { id: string },
  organizationId: string,
  trimmedQuery: string,
  readonly: boolean
): Promise<void> {
  // Check permissions based on query type
  if (isReadQuery(trimmedQuery)) {
    // SELECT queries require database.read permission
    // All authenticated users (Viewer, Developer, Admin, Owner) have database.read
    const permissionResult = await checkUserPermission(
      { id: user.id },
      organizationId,
      Permission.DATABASE_READ
    )

    if (!permissionResult.granted) {
      throw validationError(
        `You do not have permission to read from the database. ` +
        `Your role '${permissionResult.role}' does not have the 'database.read' permission. ` +
        `Please contact your organization owner to request this permission.`,
        { code: ERROR_CODES.PERMISSION_DENIED }
      )
    }
  } else if (isWriteQuery(trimmedQuery)) {
    // INSERT/UPDATE/DELETE queries require database.write permission
    // Admin and Owner roles have database.write permission
    const permissionResult = await checkUserPermission(
      { id: user.id },
      organizationId,
      Permission.DATABASE_WRITE
    )

    if (!permissionResult.granted) {
      throw validationError(
        `You do not have permission to perform write operations on the database. ` +
        `Your role '${permissionResult.role}' does not have the 'database.write' permission. ` +
        `Developers have read-only access. Please contact your organization owner to request write access.`,
        { code: ERROR_CODES.PERMISSION_DENIED }
      )
    }
  }
  // DDL and other operations also require database.write permission
  else if (!readonly) {
    const permissionResult = await checkUserPermission(
      { id: user.id },
      organizationId,
      Permission.DATABASE_WRITE
    )

    if (!permissionResult.granted) {
      throw validationError(
        `You do not have permission to perform this operation on the database. ` +
        `Your role '${permissionResult.role}' does not have the 'database.write' permission. ` +
        `DDL operations require write access. Please contact your organization owner to request this permission.`,
        { code: ERROR_CODES.PERMISSION_DENIED }
      )
    }
  }
}

/**
 * POST /api/studio/:projectId/query
 *
 * Execute SQL queries on the tenant-specific schema
 */
export async function handleQueryPost(
  req: NextRequest,
  projectId: string
): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await req.json()
    const { trimmedQuery, explain } = parseRequestBody(body)

    // US-011: Enforce Studio permissions - check permission for ALL queries
    // Authenticate request to get user ID
    const user = await authenticateRequest(req)

    // Get organization ID from project
    const organizationId = await getOrganizationId(projectId)

    // Check permissions based on query type
    await checkDatabasePermissions(user, organizationId, trimmedQuery, body.readonly !== false)

    // Get schema-scoped pool
    const pool = await withSchemaScope(req)

    // US-007: Get query timeout for this project (default 30 seconds)
    const queryTimeout = await getQueryTimeout(projectId)

    // US-008: Determine if we should run EXPLAIN ANALYZE
    const queryToExecute = explain && !isExplainQuery(trimmedQuery)
      ? wrapWithExplain(trimmedQuery)
      : trimmedQuery

    // Execute query with timeout
    const result = await executeQueryWithTimeout(pool, queryToExecute, queryTimeout)

    // Calculate execution time
    const executionTime = Date.now() - startTime

    // Build response data
    const responseData = buildResponseData(result, trimmedQuery, queryToExecute, executionTime)

    // Return successful response
    return NextResponse.json({
      success: true,
      data: responseData,
    } as QuerySuccessResponse)
  } catch (error: any) {
    // Handle validation errors with custom context
    if (error.code === ErrorCode.VALIDATION_ERROR) {
      return error.toNextResponse()
    }

    // Handle permission denied errors
    if (error.code === ErrorCode.PERMISSION_DENIED) {
      return error.toNextResponse()
    }

    // US-007: Handle query timeout errors
    if (error.message && error.message.includes('timeout exceeded')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.QUERY_TIMEOUT,
            message: error.message,
            details: {
              query_timeout: `${await getQueryTimeout(projectId)}ms`,
              suggestion: 'Consider optimizing your query or increasing the project\'s query_timeout setting.',
            },
          },
        },
        { status: HTTP_STATUS.REQUEST_TIMEOUT }
      )
    }

    // Handle all other errors
    return toErrorNextResponse(error, projectId)
  }
}

/**
 * GET /api/studio/:projectId/query
 *
 * Return information about the query API (not query execution)
 */
export async function handleQueryGet(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/studio/:projectId/query',
    method: 'POST',
    description: 'Execute SQL queries on tenant-specific schema',
    requestBody: {
      query: 'SQL query string (required)',
      readonly: 'Boolean flag to prevent destructive queries (default: true)',
      explain: 'Boolean flag to run EXPLAIN ANALYZE for query plan (default: false)',
    },
    response: {
      success: 'true if query executed successfully',
      data: {
        columns: 'Array of column names from result',
        rows: 'Array of row objects',
        rowCount: 'Number of rows returned',
        rowsAffected: 'Number of rows affected (for INSERT/UPDATE/DELETE)',
        executionTime: 'Query execution time in milliseconds',
        queryPlan: 'Query execution plan (when explain=true)',
      },
    },
    destructiveCommands: Array.from(DESTRUCTIVE_COMMANDS),
    queryTimeout: {
      description: 'Queries are automatically terminated after exceeding the configured timeout',
      defaultTimeout: '30000ms (30 seconds)',
      configurable: 'Timeout can be configured per project via the query_timeout column',
      minTimeout: '1000ms (1 second)',
      maxTimeout: '300000ms (5 minutes)',
      timeoutError: 'Returns 408 status with QUERY_TIMEOUT error code when exceeded',
    },
    queryStats: {
      description: 'US-008: Query statistics are returned with every query execution',
      executionTime: 'Time in milliseconds to execute the query',
      rowCount: 'Number of rows returned by SELECT queries',
      rowsAffected: 'Number of rows affected by INSERT/UPDATE/DELETE queries',
      queryPlan: 'Optional EXPLAIN ANALYZE output for query optimization',
    },
    rbac: {
      writeOperations: 'Requires database.write permission',
      readOperations: 'Requires database.read permission (all authenticated users)',
      permissionDenied: '403 error with clear message explaining required permission',
    },
  })
}
