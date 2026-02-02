/**
 * Log Formatters for Break Glass Audit Logger
 *
 * Provides formatting utilities for converting break glass actions
 * into human-readable descriptions and audit log entries.
 *
 * US-011: Implement Aggressive Audit Logging
 */

import {
  AdminActionType,
  AdminTargetType,
} from './admin-database';
import { AuditLogType, AuditLogLevel } from '@/features/abuse-controls/lib/audit-logger';

/**
 * Map AdminActionType to human-readable action description
 *
 * @param action - The admin action type
 * @returns Human-readable description of the action
 *
 * @example
 * ```typescript
 * const description = getActionDescription(AdminActionType.UNLOCK_PROJECT);
 * // Returns: "Break Glass: Unlocked suspended project"
 * ```
 */
export function getActionDescription(action: AdminActionType): string {
  const descriptions: Record<AdminActionType, string> = {
    [AdminActionType.UNLOCK_PROJECT]: 'Break Glass: Unlocked suspended project',
    [AdminActionType.OVERRIDE_SUSPENSION]: 'Break Glass: Overrode auto-suspension',
    [AdminActionType.FORCE_DELETE]: 'Break Glass: Force deleted project',
    [AdminActionType.REGENERATE_KEYS]: 'Break Glass: Regenerated system keys',
    [AdminActionType.ACCESS_PROJECT]: 'Break Glass: Accessed project details',
    [AdminActionType.OVERRIDE_QUOTA]: 'Break Glass: Overrode quota limit',
    [AdminActionType.EMERGENCY_ACTION]: 'Break Glass: Emergency action performed',
  };
  return descriptions[action] || `Break Glass: ${action}`;
}

/**
 * Map AdminTargetType to audit log category
 *
 * @param targetType - The target type of the admin action
 * @returns The corresponding audit log type
 *
 * @example
 * ```typescript
 * const logType = getAuditLogType(AdminTargetType.PROJECT);
 * // Returns: AuditLogType.MANUAL_INTERVENTION
 * ```
 */
export function getAuditLogType(targetType: AdminTargetType): AuditLogType {
  const mapping: Partial<Record<AdminTargetType, AuditLogType>> = {
    [AdminTargetType.PROJECT]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.API_KEY]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.DEVELOPER]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.SUSPENSION]: AuditLogType.UNSUSPENSION,
    [AdminTargetType.QUOTA]: AuditLogType.MANUAL_INTERVENTION,
    [AdminTargetType.SYSTEM]: AuditLogType.MANUAL_INTERVENTION,
  };
  return mapping[targetType] || AuditLogType.MANUAL_INTERVENTION;
}

/**
 * Get severity level based on action type
 *
 * Critical actions that bypass security (force delete, key regeneration) are marked as CRITICAL.
 * Important security actions (unlock, override) are marked as WARNING.
 * Read-only actions are marked as INFO.
 *
 * @param action - The admin action type
 * @returns The appropriate severity level
 *
 * @example
 * ```typescript
 * const severity = getSeverityLevel(AdminActionType.FORCE_DELETE);
 * // Returns: AuditLogLevel.CRITICAL
 * ```
 */
export function getSeverityLevel(action: AdminActionType): AuditLogLevel {
  // Critical actions that bypass security
  if (
    action === AdminActionType.FORCE_DELETE ||
    action === AdminActionType.REGENERATE_KEYS ||
    action === AdminActionType.EMERGENCY_ACTION
  ) {
    return AuditLogLevel.CRITICAL;
  }

  // Important but less critical actions
  if (
    action === AdminActionType.UNLOCK_PROJECT ||
    action === AdminActionType.OVERRIDE_SUSPENSION ||
    action === AdminActionType.OVERRIDE_QUOTA
  ) {
    return AuditLogLevel.WARNING;
  }

  // Read-only actions
  return AuditLogLevel.INFO;
}
