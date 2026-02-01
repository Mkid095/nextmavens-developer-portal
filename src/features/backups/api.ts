/**
 * Backup API Client
 *
 * Handles all API calls for backup operations.
 * Uses the api-gateway endpoints.
 */

import type {
  Backup,
  BackupType,
  BackupResponse,
  BackupStats,
} from '@nextmavenspacks/audit-logs-database';

const API_BASE = '/api/backups';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch backups for a project
 */
export async function fetchBackups(
  projectId: string,
  options?: {
    type?: BackupType;
    limit?: number;
    offset?: number;
  }
): Promise<BackupResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const params = new URLSearchParams();
  if (options?.type) params.append('type', options.type);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/${projectId}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch backups' }));
    throw new Error(error.error || 'Failed to fetch backups');
  }

  return response.json();
}

/**
 * Fetch backup statistics
 */
export async function fetchBackupStats(projectId: string): Promise<BackupStats> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE}/${projectId}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch backup stats' }));
    throw new Error(error.error || 'Failed to fetch backup stats');
  }

  return response.json();
}

/**
 * Export database backup
 */
export async function exportDatabase(projectId: string): Promise<{ fileId: string; size: number }> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE}/${projectId}/export/database`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to export database' }));
    throw new Error(error.error || 'Failed to export database');
  }

  return response.json();
}

/**
 * Export logs backup
 */
export async function exportLogs(projectId: string): Promise<{ fileId: string; size: number }> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE}/${projectId}/export/logs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to export logs' }));
    throw new Error(error.error || 'Failed to export logs');
  }

  return response.json();
}

/**
 * Send backup to Telegram
 */
export async function sendToTelegram(
  projectId: string,
  backupId: string
): Promise<{ success: boolean; telegramFileId?: string }> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE}/${projectId}/telegram/${backupId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send to Telegram' }));
    throw new Error(error.error || 'Failed to send to Telegram');
  }

  return response.json();
}

/**
 * Delete a backup
 */
export async function deleteBackup(projectId: string, backupId: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE}/${projectId}/${backupId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete backup' }));
    throw new Error(error.error || 'Failed to delete backup');
  }
}
