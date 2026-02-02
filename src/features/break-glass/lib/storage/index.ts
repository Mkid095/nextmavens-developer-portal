/**
 * Break Glass Storage Operations Index
 * Re-exports all storage functions for the break glass audit logger
 */

// Admin actions operations
export {
  insertAdminAction,
  queryAdminAction,
  queryAdminActionsForReport,
} from './admin-actions';

// Audit logs operations
export {
  queryAuditLogs,
  queryAuditLogByActionId,
} from './audit-logs';

// History operations
export {
  queryAdminActionsHistory,
} from './history';

// Sessions operations
export {
  getAdminSessionDetails,
  querySessionAuditTrail,
} from './sessions';

// Query builders
export {
  buildWhereClause,
  buildAdminActionsHistoryQuery,
  buildAuditLogsQuery,
  buildAdminActionsReportQuery,
  type QueryFilters,
  type BuiltQuery,
} from './query-builders';
