/**
 * useBackups Hook
 *
 * Custom hook for managing backup state and operations.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Backup,
  BackupType,
  BackupResponse,
  BackupStats,
} from '@nextmavenspacks/audit-logs-database';
import type { BackupOperation, BackupFilters } from './types';
import {
  fetchBackups,
  fetchBackupStats,
  exportDatabase,
  exportLogs,
  sendToTelegram,
  deleteBackup,
} from './api';

interface UseBackupsOptions {
  projectId: string | null;
  autoFetch?: boolean;
}

interface UseBackupsReturn {
  backups: Backup[];
  stats: BackupStats | null;
  loading: boolean;
  error: string | null;
  operation: BackupOperation;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: BackupFilters;
  setFilters: (filters: BackupFilters) => void;
  refresh: () => Promise<void>;
  handleExportDatabase: () => Promise<void>;
  handleExportLogs: () => Promise<void>;
  handleSendToTelegram: (backupId: string) => Promise<void>;
  handleDeleteBackup: (backupId: string) => Promise<void>;
  handlePageChange: (newOffset: number) => void;
}

const DEFAULT_LIMIT = 20;

export function useBackups({
  projectId,
  autoFetch = true,
}: UseBackupsOptions): UseBackupsReturn {
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<BackupOperation>({
    type: 'export-database',
    status: 'idle',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: DEFAULT_LIMIT,
    offset: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<BackupFilters>({});

  const refresh = useCallback(async () => {
    if (!projectId || projectId === '') {
      setError('No project ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [backupsData, statsData] = await Promise.all([
        fetchBackups(projectId, {
          type: filters.type,
          limit: pagination.limit,
          offset: pagination.offset,
        }),
        fetchBackupStats(projectId),
      ]);

      setBackups(backupsData.data);
      setStats(statsData);
      setPagination({
        total: backupsData.total,
        limit: backupsData.limit,
        offset: backupsData.offset,
        hasMore: backupsData.has_more,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch backups';
      setError(message);

      if (message.includes('401') || message.includes('authentication')) {
        localStorage.clear();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, filters, pagination.limit, pagination.offset, router]);

  useEffect(() => {
    if (autoFetch && projectId) {
      refresh();
    }
  }, [autoFetch, projectId, refresh]);

  const handleExportDatabase = async () => {
    if (!projectId) return;

    setOperation({ type: 'export-database', status: 'loading' });
    setError(null);

    try {
      await exportDatabase(projectId);
      setOperation({ type: 'export-database', status: 'success' });
      await refresh();

      setTimeout(() => {
        setOperation({ type: 'export-database', status: 'idle' });
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export database';
      setOperation({ type: 'export-database', status: 'error', error: message });
    }
  };

  const handleExportLogs = async () => {
    if (!projectId) return;

    setOperation({ type: 'export-logs', status: 'loading' });
    setError(null);

    try {
      await exportLogs(projectId);
      setOperation({ type: 'export-logs', status: 'success' });
      await refresh();

      setTimeout(() => {
        setOperation({ type: 'export-logs', status: 'idle' });
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export logs';
      setOperation({ type: 'export-logs', status: 'error', error: message });
    }
  };

  const handleSendToTelegram = async (backupId: string) => {
    if (!projectId) return;

    setOperation({ type: 'send-telegram', status: 'loading' });
    setError(null);

    try {
      await sendToTelegram(projectId, backupId);
      setOperation({ type: 'send-telegram', status: 'success' });
      await refresh();

      setTimeout(() => {
        setOperation({ type: 'send-telegram', status: 'idle' });
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send to Telegram';
      setOperation({ type: 'send-telegram', status: 'error', error: message });
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!projectId) return;

    setError(null);

    try {
      await deleteBackup(projectId, backupId);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete backup';
      setError(message);
    }
  };

  const handlePageChange = (newOffset: number) => {
    setPagination((prev) => ({
      ...prev,
      offset: newOffset,
    }));
  };

  return {
    backups,
    stats,
    loading,
    error,
    operation,
    pagination,
    filters,
    setFilters,
    refresh,
    handleExportDatabase,
    handleExportLogs,
    handleSendToTelegram,
    handleDeleteBackup,
    handlePageChange,
  };
}
