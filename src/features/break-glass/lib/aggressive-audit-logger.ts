/**
 * Aggressive Audit Logger for Break Glass Mode
 *
 * Ensures ALL break glass actions are aggressively logged to both:
 * 1. admin_actions table (break glass specific)
 * 2. audit_logs table (standard platform audit trail)
 *
 * This creates a complete, searchable audit trail of all emergency access.
 *
 * US-011: Implement Aggressive Audit Logging
 *
 * @example
 * ```typescript
 * import { logBreakGlassAction } from '@/features/break-glass/lib/aggressive-audit-logger';
 *
 * await logBreakGlassAction({
 *   adminId: 'admin-123',
 *   sessionId: 'session-456',
 *   action: AdminActionType.UNLOCK_PROJECT,
 *   targetType: AdminTargetType.PROJECT,
 *   targetId: 'proj-789',
 *   beforeState: { status: 'SUSPENDED' },
 *   afterState: { status: 'ACTIVE' },
 *   metadata: { reason: 'False positive verified' },
 * });
 * ```
 */

// Re-export all public APIs from the modular structure
export { logBreakGlassAction } from './handlers';
export { getActionDescription, getAuditLogType, getSeverityLevel } from './formatters';
export { verifyAuditCoverage, getAuditCoverageReport, validateAuditLogEntry, compareAuditLogs } from './utils-audit';

// Re-export query functions
export { getBreakGlassAuditHistory, getBreakGlassAuditLogs, getSessionAuditTrail } from './queries';

// Re-export types
export type { BreakGlassAuditParams, BreakGlassAuditEntry, CombinedAuditRecord } from './types';
