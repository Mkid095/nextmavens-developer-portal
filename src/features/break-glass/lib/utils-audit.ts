/**
 * Utilities for Break Glass Audit Logger
 *
 * Provides utility functions for audit coverage verification,
 * reporting, and validation.
 *
 * US-011: Implement Aggressive Audit Logging
 */

import { queryAdminAction, queryAuditLogByActionId, queryAdminActionsForReport } from './storage';
import type { BreakGlassAuditEntry } from './types';
import type { AdminAction } from './admin-database';

/**
 * Verify that an action has complete audit coverage
 *
 * Checks that an action exists in BOTH admin_actions AND audit_logs.
 * Used for audit compliance verification.
 *
 * @param adminActionId - Admin action ID to verify
 * @returns Verification result with completeness status and any issues
 *
 * @example
 * ```typescript
 * const verification = await verifyAuditCoverage('action-123');
 * if (!verification.complete) {
 *   console.error('Audit coverage incomplete:', verification.issues);
 * }
 * ```
 */
export async function verifyAuditCoverage(
  adminActionId: string
): Promise<{
  complete: boolean;
  adminAction: AdminAction | null;
  auditLog: BreakGlassAuditEntry | null;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check admin_actions table
  const adminAction = await queryAdminAction(adminActionId);

  if (!adminAction) {
    issues.push(`Admin action ${adminActionId} not found in admin_actions table`);
  }

  // Check audit_logs table
  const auditLog = await queryAuditLogByActionId(adminActionId);

  if (!auditLog) {
    issues.push(`Admin action ${adminActionId} not found in audit_logs table`);
  }

  // Verify details match
  if (adminAction && auditLog) {
    if (auditLog.details.session_id !== adminAction.session_id) {
      issues.push(`Session ID mismatch between admin_actions and audit_logs`);
    }
    if (auditLog.details.break_glass_action !== adminAction.action) {
      issues.push(`Action mismatch between admin_actions and audit_logs`);
    }
  }

  return {
    complete: issues.length === 0,
    adminAction,
    auditLog,
    issues,
  };
}

/**
 * Get audit coverage report for all break glass actions
 *
 * Generates a comprehensive report of audit coverage, including
 * total actions, complete coverage count, and any incomplete actions
 * with their issues.
 *
 * @param filters - Optional filters for the report
 * @returns Audit coverage report with statistics and incomplete actions
 *
 * @example
 * ```typescript
 * const report = await getAuditCoverageReport({
 *   adminId: 'admin-123',
 *   startDate: new Date('2024-01-01'),
 * });
 * console.log(`Total actions: ${report.totalActions}`);
 * console.log(`Complete coverage: ${report.completeCoverage}`);
 * if (report.incompleteActions.length > 0) {
 *   console.error('Incomplete actions:', report.incompleteActions);
 * }
 * ```
 */
export async function getAuditCoverageReport(filters: {
  adminId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalActions: number;
  completeCoverage: number;
  incompleteActions: Array<{
    adminActionId: string;
    issues: string[];
  }>;
}> {
  const { adminId, sessionId, startDate, endDate } = filters;

  // Get all admin actions matching filters
  const actions = await queryAdminActionsForReport({
    adminId,
    sessionId,
    startDate,
    endDate,
  });

  const incompleteActions: Array<{
    adminActionId: string;
    issues: string[];
  }> = [];
  let completeCoverage = 0;

  // Verify each action
  for (const action of actions) {
    const verification = await verifyAuditCoverage(action.id);
    if (verification.complete) {
      completeCoverage++;
    } else {
      incompleteActions.push({
        adminActionId: action.id,
        issues: verification.issues,
      });
    }
  }

  return {
    totalActions: actions.length,
    completeCoverage,
    incompleteActions,
  };
}

/**
 * Validate audit log entry completeness
 *
 * Checks that an audit log entry has all required fields and valid data.
 *
 * @param auditLog - Audit log entry to validate
 * @returns Validation result with any missing or invalid fields
 *
 * @example
 * ```typescript
 * const validation = validateAuditLogEntry(auditLog);
 * if (!validation.valid) {
 *   console.error('Invalid audit log:', validation.issues);
 * }
 * ```
 */
export function validateAuditLogEntry(
  auditLog: BreakGlassAuditEntry
): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check required fields
  if (!auditLog.id) {
    issues.push('Missing ID');
  }

  if (!auditLog.log_type) {
    issues.push('Missing log_type');
  }

  if (!auditLog.severity) {
    issues.push('Missing severity');
  }

  if (!auditLog.action) {
    issues.push('Missing action');
  }

  if (!auditLog.occurred_at) {
    issues.push('Missing occurred_at timestamp');
  }

  // Check break glass specific fields in details
  if (!auditLog.details) {
    issues.push('Missing details object');
  } else {
    if (!auditLog.details.admin_id) {
      issues.push('Missing admin_id in details');
    }

    if (!auditLog.details.session_id) {
      issues.push('Missing session_id in details');
    }

    if (!auditLog.details.break_glass_action) {
      issues.push('Missing break_glass_action in details');
    }

    if (!auditLog.details.target_type) {
      issues.push('Missing target_type in details');
    }

    if (!auditLog.details.target_id) {
      issues.push('Missing target_id in details');
    }

    if (!auditLog.details.admin_action_id) {
      issues.push('Missing admin_action_id in details');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Compare two audit logs for consistency
 *
 * Compares an admin action with its corresponding audit log entry
 * to ensure data consistency between the two tables.
 *
 * @param adminAction - Admin action from admin_actions table
 * @param auditLog - Audit log entry from audit_logs table
 * @returns Comparison result with any inconsistencies found
 *
 * @example
 * ```typescript
 * const comparison = compareAuditLogs(adminAction, auditLog);
 * if (!comparison.consistent) {
 *   console.error('Inconsistent audit logs:', comparison.inconsistencies);
 * }
 * ```
 */
export function compareAuditLogs(
  adminAction: AdminAction,
  auditLog: BreakGlassAuditEntry
): {
  consistent: boolean;
  inconsistencies: string[];
} {
  const inconsistencies: string[] = [];

  // Check session ID
  if (adminAction.session_id !== auditLog.details.session_id) {
    inconsistencies.push(
      `Session ID mismatch: admin_actions=${adminAction.session_id}, audit_logs=${auditLog.details.session_id}`
    );
  }

  // Check action type
  if (adminAction.action !== auditLog.details.break_glass_action) {
    inconsistencies.push(
      `Action mismatch: admin_actions=${adminAction.action}, audit_logs=${auditLog.details.break_glass_action}`
    );
  }

  // Check target ID
  if (adminAction.target_id !== auditLog.details.target_id) {
    inconsistencies.push(
      `Target ID mismatch: admin_actions=${adminAction.target_id}, audit_logs=${auditLog.details.target_id}`
    );
  }

  // Check admin action ID reference
  if (adminAction.id !== auditLog.details.admin_action_id) {
    inconsistencies.push(
      `Admin action ID mismatch: admin_actions.id=${adminAction.id}, audit_logs.details.admin_action_id=${auditLog.details.admin_action_id}`
    );
  }

  // Check before state
  if (JSON.stringify(adminAction.before_state) !== JSON.stringify(auditLog.details.before_state)) {
    inconsistencies.push('Before state mismatch between admin_actions and audit_logs');
  }

  // Check after state
  if (JSON.stringify(adminAction.after_state) !== JSON.stringify(auditLog.details.after_state)) {
    inconsistencies.push('After state mismatch between admin_actions and audit_logs');
  }

  return {
    consistent: inconsistencies.length === 0,
    inconsistencies,
  };
}
