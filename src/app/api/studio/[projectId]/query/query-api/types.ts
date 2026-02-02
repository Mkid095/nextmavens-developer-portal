/**
 * SQL Query API - Type Definitions
 *
 * US-002: Create Execute Query API
 * US-007: Add Query Timeout
 * US-008: Show Query Stats
 * US-010: Enforce Database Write Permissions
 * US-011: Enforce Studio Permissions
 */

import { NextRequest } from 'next/server'

/**
 * Request body for query execution
 */
export interface QueryRequestBody {
  query: string
  readonly?: boolean
  explain?: boolean
}

/**
 * Query execution result data
 */
export interface QueryResultData {
  columns: string[]
  rows: any[]
  rowCount: number
  rowsAffected?: number
  executionTime: number
  queryPlan?: any
}

/**
 * Successful query response
 */
export interface QuerySuccessResponse {
  success: true
  data: QueryResultData
}

/**
 * Query error response details
 */
export interface QueryErrorDetails {
  code: string
  message: string
  details?: {
    command?: string
    readonlyMode?: boolean
    received?: string
    query_timeout?: string
    suggestion?: string
  }
}

/**
 * Query error response
 */
export interface QueryErrorResponse {
  success: false
  error: QueryErrorDetails
}

/**
 * Handler context with parsed request data
 */
export interface HandlerContext {
  req: NextRequest
  projectId: string
  startTime: number
}

/**
 * Parsed and validated request data
 */
export interface ParsedRequest {
  query: string
  readonly: boolean
  explain: boolean
  trimmedQuery: string
}
