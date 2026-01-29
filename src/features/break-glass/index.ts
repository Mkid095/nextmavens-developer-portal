/**
 * Break Glass Mode Feature
 *
 * Emergency access system with aggressive audit logging.
 *
 * US-001: Create Admin Sessions Table
 * US-002: Create Admin Actions Table
 * US-003: Implement Break Glass Authentication
 * US-004: Implement Unlock Project Power
 * US-005: Implement Override Suspension Power
 * US-010: Implement Session Expiration
 * US-011: Implement Aggressive Audit Logging
 */

// Database layer
export {
  createAdminSession,
  validateAdminSession,
  logAdminAction,
  getAdminSession,
  getSessionActions,
  getAdminSessions,
  getTargetActionHistory,
  cleanupExpiredSessions,
  type AdminSession,
  type AdminAction,
  type CreateAdminSessionParams,
  type LogAdminActionParams,
  type AdminSessionValidation,
  enum AdminAccessMethod,
  enum AdminActionType,
  enum AdminTargetType,
} from './lib/admin-database';

// Services
export {
  unlockProject,
  getUnlockHistory,
  validateUnlockRequest,
  type UnlockProjectParams,
  type UnlockProjectResponse,
} from './lib/unlock-project.service';

export {
  overrideSuspension,
  getOverrideHistory,
  validateOverrideRequest,
  type OverrideSuspensionParams,
  type OverrideSuspensionResponse,
} from './lib/override-suspension.service';

// Aggressive audit logging
export {
  logBreakGlassAction,
  getBreakGlassAuditHistory,
  getBreakGlassAuditLogs,
  getSessionAuditTrail,
  verifyAuditCoverage,
  getAuditCoverageReport,
  type BreakGlassAuditParams,
  type BreakGlassAuditEntry,
  type CombinedAuditRecord,
} from './lib/aggressive-audit-logger';
