/**
 * SQL Query Execution API
 *
 * @deprecated This file has been refactored into the query-api module.
 * Please import from './query-api' instead.
 *
 * US-002: Create Execute Query API
 * US-007: Add Query Timeout
 * US-008: Show Query Stats
 * US-010: Enforce Database Write Permissions
 * US-011: Enforce Studio Permissions
 *
 * Executes SQL queries on tenant-specific schemas with readonly mode protection.
 * Validates queries for destructive operations when readonly mode is enabled.
 * Checks database.read permission for SELECT queries.
 * Checks database.write permission for non-readonly queries (INSERT/UPDATE/DELETE).
 * Enforces configurable query timeout per project (default 30 seconds).
 * Supports EXPLAIN/EXPLAIN ANALYZE for query plan analysis.
 * Returns rowsAffected for write operations (INSERT/UPDATE/DELETE).
 *
 * Permission Matrix:
 * - Viewers: SELECT only
 * - Developers: SELECT, INSERT, UPDATE
 * - Admins/Owners: Full access (SELECT, INSERT, UPDATE, DELETE, DDL)
 *
 * POST /api/studio/:projectId/query
 *
 * Request body:
 * {
 *   "query": "SELECT * FROM users LIMIT 10",
 *   "readonly": true,
 *   "explain": false  // Optional: run EXPLAIN ANALYZE
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "columns": ["id", "name", "email"],
 *     "rows": [{ "id": 1, "name": "John", "email": "john@example.com" }],
 *     "rowCount": 1,
 *     "rowsAffected": 1,  // For write operations
 *     "executionTime": 45,
 *     "queryPlan": {...}  // When explain=true
 *   }
 * }
 */

import { handleQueryPost, handleQueryGet } from './query-api/handlers'
import { NextRequest } from 'next/server'
import { RouteHandlerContext } from '@/types/api'

// Named exports for Next.js route handlers
export async function POST(request: NextRequest, { params }: RouteHandlerContext) {
  return handleQueryPost(request, params.projectId)
}

export async function GET(request: NextRequest, { params }: RouteHandlerContext) {
  return handleQueryGet()
}
