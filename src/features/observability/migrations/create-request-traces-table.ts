/**
 * Migration: Create Request Traces Table
 *
 * US-001: Create Request Traces Table
 *
 * Creates the request_traces table in the control_plane schema for tracking
 * request flow across services with timing information.
 *
 * @example
 * ```typescript
 * import { runMigration, rollbackMigration } from './create-request-traces-table';
 *
 * // Run the migration
 * await runMigration();
 *
 * // Rollback the migration
 * await rollbackMigration();
 * ```
 */

import { getPool } from '@/lib/db';
import type { Pool, PoolClient } from 'pg';

/**
 * SQL to create the request_traces table
 */
const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS control_plane.request_traces (
    request_id UUID PRIMARY KEY,
    project_id TEXT NOT NULL,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    services_hit JSONB DEFAULT '[]'::jsonb,
    total_duration_ms BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

/**
 * SQL to create indexes on the request_traces table
 */
const CREATE_INDEXES_SQL = [
  // Index on project_id for querying by project
  `CREATE INDEX IF NOT EXISTS idx_request_traces_project_id
   ON control_plane.request_traces(project_id);`,

  // Index on created_at for time range queries
  `CREATE INDEX IF NOT EXISTS idx_request_traces_created_at
   ON control_plane.request_traces(created_at DESC);`,

  // Composite index for project + time queries (common pattern)
  `CREATE INDEX IF NOT EXISTS idx_request_traces_project_created
   ON control_plane.request_traces(project_id, created_at DESC);`,
];

/**
 * SQL to drop the request_traces table (rollback)
 */
const DROP_TABLE_SQL = `
  DROP TABLE IF EXISTS control_plane.request_traces CASCADE;
`;

/**
 * SQL to drop the indexes (rollback)
 */
const DROP_INDEXES_SQL = [
  `DROP INDEX IF EXISTS control_plane.idx_request_traces_project_id;`,
  `DROP INDEX IF EXISTS control_plane.idx_request_traces_created_at;`,
  `DROP INDEX IF EXISTS control_plane.idx_request_traces_project_created;`,
];

/**
 * Run the migration to create the request_traces table
 *
 * Creates the table and all necessary indexes for efficient querying.
 *
 * @returns Promise that resolves when the migration is complete
 */
export async function runMigration(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create the table
    await client.query(CREATE_TABLE_SQL);
    console.log('[Migration] Created request_traces table');

    // Create indexes
    for (const indexSql of CREATE_INDEXES_SQL) {
      await client.query(indexSql);
    }
    console.log('[Migration] Created request_traces indexes');

    await client.query('COMMIT');
    console.log('[Migration] request_traces table migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Migration] Failed to create request_traces table:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rollback the migration by dropping the request_traces table
 *
 * @returns Promise that resolves when the rollback is complete
 */
export async function rollbackMigration(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Drop indexes first
    for (const indexSql of DROP_INDEXES_SQL) {
      await client.query(indexSql);
    }
    console.log('[Rollback] Dropped request_traces indexes');

    // Drop the table
    await client.query(DROP_TABLE_SQL);
    console.log('[Rollback] Dropped request_traces table');

    await client.query('COMMIT');
    console.log('[Rollback] request_traces table rollback completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Rollback] Failed to drop request_traces table:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify that the request_traces table exists and has the correct schema
 *
 * @returns Promise that resolves to true if the table exists and is valid
 */
export async function verifyMigration(): Promise<boolean> {
  const pool = getPool();

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'request_traces'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return false;
    }

    // Check if columns exist
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'control_plane'
      AND table_name = 'request_traces'
      ORDER BY ordinal_position;
    `);

    const expectedColumns = [
      { name: 'request_id', type: 'uuid', nullable: 'NO' },
      { name: 'project_id', type: 'text', nullable: 'NO' },
      { name: 'path', type: 'text', nullable: 'NO' },
      { name: 'method', type: 'text', nullable: 'NO' },
      { name: 'services_hit', type: 'jsonb', nullable: 'YES' },
      { name: 'total_duration_ms', type: 'bigint', nullable: 'YES' },
      { name: 'created_at', type: 'timestamp with time zone', nullable: 'YES' },
    ];

    if (columns.rows.length !== expectedColumns.length) {
      console.warn('[Verify] Column count mismatch');
      return false;
    }

    for (let i = 0; i < expectedColumns.length; i++) {
      const column = columns.rows[i];
      const expected = expectedColumns[i];

      if (column.column_name !== expected.name) {
        console.warn(`[Verify] Column ${i} name mismatch: ${column.column_name} != ${expected.name}`);
        return false;
      }

      if (!column.data_type.startsWith(expected.type)) {
        console.warn(`[Verify] Column ${expected.name} type mismatch: ${column.data_type} != ${expected.type}`);
        return false;
      }

      if (expected.nullable === 'NO' && column.is_nullable === 'YES') {
        console.warn(`[Verify] Column ${expected.name} should be NOT NULL`);
        return false;
      }
    }

    // Check if indexes exist
    const indexes = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'control_plane'
      AND tablename = 'request_traces';
    `);

    const expectedIndexes = [
      'idx_request_traces_project_id',
      'idx_request_traces_created_at',
      'idx_request_traces_project_created',
    ];

    const indexNames = indexes.rows.map((row) => row.indexname);

    for (const expectedIndex of expectedIndexes) {
      if (!indexNames.includes(expectedIndex)) {
        console.warn(`[Verify] Missing index: ${expectedIndex}`);
        return false;
      }
    }

    console.log('[Verify] request_traces table migration verified successfully');
    return true;
  } catch (error) {
    console.error('[Verify] Failed to verify request_traces table:', error);
    return false;
  }
}

// Allow running this migration directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    try {
      if (command === 'rollback') {
        await rollbackMigration();
        process.exit(0);
      } else if (command === 'verify') {
        const isValid = await verifyMigration();
        process.exit(isValid ? 0 : 1);
      } else {
        await runMigration();
        process.exit(0);
      }
    } catch (error) {
      console.error('[Migration] Error:', error);
      process.exit(1);
    }
  })();
}
