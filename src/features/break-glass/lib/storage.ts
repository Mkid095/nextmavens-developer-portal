/**
 * Storage Operations for Break Glass Audit Logger
 *
 * Handles all database storage operations for break glass audit logging,
 * including inserting admin actions and querying audit history.
 *
 * US-011: Implement Aggressive Audit Logging
 *
 * @module storage
 */

// Re-export all storage operations from modular subdirectory
export {
  // Admin actions operations
  insertAdminAction,
  queryAdminAction,
  queryAdminActionsForReport,

  // Audit logs operations
  queryAuditLogs,
  queryAuditLogByActionId,

  // History operations
  queryAdminActionsHistory,

  // Sessions operations
  getAdminSessionDetails,
  querySessionAuditTrail,

  // Query builders
  buildWhereClause,
  buildAdminActionsHistoryQuery,
  buildAuditLogsQuery,
  buildAdminActionsReportQuery,
  type QueryFilters,
  type BuiltQuery,
} from './storage/index';
