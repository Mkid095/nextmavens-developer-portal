/**
 * Database Schema Scoping Middleware
 *
 * Middleware for scoping database queries to tenant-specific schemas.
 * Enforces project isolation by setting search_path based on project_id.
 *
 * US-002: Scope Database Queries
 *
 * @example
 * ```typescript
 * import { withSchemaScope } from '@/lib/middleware/schema-scope';
 * import { NextRequest } from 'next/server';
 *
 * // In an API route
 * export async function GET(req: NextRequest) {
 *   const pool = await withSchemaScope(req);
 *   // All queries via this pool are scoped to tenant_{project_id}
 *   const result = await pool.query('SELECT * FROM users');
 *   return NextResponse.json({ data: result.rows });
 * }
 * ```
 */

export * from './scope'
export default withSchemaScope
