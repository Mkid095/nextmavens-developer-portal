/**
 * Observability Migrations Index
 *
 * Exports all observability-related migrations for easy access.
 *
 * @example
 * ```typescript
 * import { migrations } from '@/features/observability/migrations';
 *
 * // Run all migrations
 * for (const migration of migrations) {
 *   await migration.run();
 * }
 * ```
 */

export { runMigration as createRequestTracesTable, rollbackMigration as rollbackRequestTracesTable, verifyMigration as verifyRequestTracesTable } from './create-request-traces-table';

/**
 * Array of all observability migrations
 */
export const migrations = [
  {
    name: 'create-request-traces-table',
    run: () => import('./create-request-traces-table').then((m) => m.runMigration()),
    rollback: () => import('./create-request-traces-table').then((m) => m.rollbackMigration()),
    verify: () => import('./create-request-traces-table').then((m) => m.verifyMigration()),
  },
];
