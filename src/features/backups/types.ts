/**
 * Backup Types
 *
 * Type definitions for the backup UI feature.
 * Extends the database types with UI-specific types.
 */

import type {
  Backup,
  BackupType,
  BackupStats,
} from '@nextmavens/audit-logs-database';

/**
 * Backup status for UI display
 */
export type BackupStatus = 'completed' | 'pending' | 'failed' | 'expired';

/**
 * Extended backup interface with UI properties
 */
export interface BackupWithStatus extends Backup {
  status: BackupStatus;
  isExpiringSoon?: boolean;
}

/**
 * Backup action types
 */
export type BackupAction = 'export-database' | 'export-logs' | 'send-telegram';

/**
 * Backup operation state
 */
export interface BackupOperation {
  type: BackupAction;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

/**
 * Backup filters
 */
export interface BackupFilters {
  type?: BackupType;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Check if backup is expiring soon (within 7 days)
 */
export function isExpiringSoon(expiresAt: Date): boolean {
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
}

/**
 * Get backup status from dates
 */
export function getBackupStatus(backup: Backup): BackupStatus {
  const now = new Date();

  if (backup.expires_at < now) {
    return 'expired';
  }

  return 'completed';
}

/**
 * Get backup type label
 */
export function getBackupTypeLabel(type: BackupType): string {
  const labels: Record<BackupType, string> = {
    database: 'Database',
    storage: 'Storage',
    logs: 'Logs',
  };
  return labels[type] || type;
}

/**
 * Get backup type icon color
 */
export function getBackupTypeColor(type: BackupType): string {
  const colors: Record<BackupType, string> = {
    database: 'bg-blue-100 text-blue-700',
    storage: 'bg-orange-100 text-orange-700',
    logs: 'bg-purple-100 text-purple-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}
