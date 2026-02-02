/**
 * Break Glass Notification Utilities
 *
 * Utility functions for formatting, recipient management, and helpers.
 *
 * US-012: Add Break Glass Notifications
 */

import { SUPPORT_EMAIL } from '@/features/abuse-controls/lib/config';

/**
 * Platform owner email addresses (from environment variable)
 * Comma-separated list of emails that should receive break glass notifications
 */
const BREAK_GLASS_NOTIFICATION_EMAILS = process.env.BREAK_GLASS_NOTIFICATION_EMAILS
  ? process.env.BREAK_GLASS_NOTIFICATION_EMAILS.split(',').map(e => e.trim())
  : [];

/**
 * Get list of platform owner emails to notify
 *
 * @returns Array of email addresses
 */
export function getNotificationRecipients(): string[] {
  // Always include configured platform owner emails
  const recipients = [...BREAK_GLASS_NOTIFICATION_EMAILS];

  // If no recipients configured, use support email as fallback
  if (recipients.length === 0) {
    console.warn('[BreakGlassNotifications] No BREAK_GLASS_NOTIFICATION_EMAILS configured, using support email');
    recipients.push(SUPPORT_EMAIL);
  }

  return recipients;
}

/**
 * Format access method for display
 *
 * @param accessMethod - The internal access method identifier
 * @returns Human-readable display name
 */
export function formatAccessMethod(accessMethod: string): string {
  const displayNames: Record<string, string> = {
    'hardware_key': 'Hardware Key (Security Key)',
    'otp': 'OTP / 2FA Code',
    'emergency_code': 'Emergency Code',
  };
  return displayNames[accessMethod] || accessMethod;
}

/**
 * Format action for display
 *
 * @param action - The internal action identifier
 * @returns Human-readable display name
 */
export function formatAction(action: string): string {
  const displayNames: Record<string, string> = {
    'unlock_project': 'Unlocked Suspended Project',
    'override_suspension': 'Overrode Auto-Suspension',
    'force_delete': 'Force Deleted Project',
    'regenerate_keys': 'Regenerated System Keys',
    'access_project': 'Accessed Project Details',
    'override_quota': 'Overrode Quota Limit',
    'emergency_action': 'Emergency Action',
  };
  return displayNames[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format target type for display
 *
 * @param targetType - The internal target type identifier
 * @returns Human-readable display name
 */
export function formatTargetType(targetType: string): string {
  const displayNames: Record<string, string> = {
    'project': 'Project',
    'api_key': 'API Key',
    'developer': 'Developer',
    'suspension': 'Suspension',
    'quota': 'Quota',
    'system': 'System',
  };
  return displayNames[targetType] || targetType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format date for display in notifications
 *
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleString();
}
