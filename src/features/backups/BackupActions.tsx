/**
 * BackupActions Component
 *
 * Action buttons for creating backups and sending to Telegram.
 */

'use client';

import { Database, FileText, Send, Loader2, Check, AlertCircle } from 'lucide-react';
import type { BackupOperation } from './types';

interface BackupActionsProps {
  operation: BackupOperation;
  onExportDatabase: () => void;
  onExportLogs: () => void;
}

export function BackupActions({ operation, onExportDatabase, onExportLogs }: BackupActionsProps) {
  const isLoading = operation.status === 'loading';
  const isSuccess = operation.status === 'success';
  const isError = operation.status === 'error';

  const getButtonState = (type: 'export-database' | 'export-logs') => {
    const isCurrentOperation = operation.type === type;
    if (isCurrentOperation && isLoading) return 'loading';
    if (isCurrentOperation && isSuccess) return 'success';
    if (isCurrentOperation && isError) return 'error';
    return 'idle';
  };

  const databaseButtonState = getButtonState('export-database');
  const logsButtonState = getButtonState('export-logs');

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onExportDatabase}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {databaseButtonState === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting Database...
          </>
        ) : databaseButtonState === 'success' ? (
          <>
            <Check className="w-4 h-4" />
            Database Exported
          </>
        ) : databaseButtonState === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            Retry Export
          </>
        ) : (
          <>
            <Database className="w-4 h-4" />
            Export Database
          </>
        )}
      </button>

      <button
        onClick={onExportLogs}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {logsButtonState === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting Logs...
          </>
        ) : logsButtonState === 'success' ? (
          <>
            <Check className="w-4 h-4" />
            Logs Exported
          </>
        ) : logsButtonState === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            Retry Export
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Export Logs
          </>
        )}
      </button>

      {isError && operation.error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {operation.error}
        </div>
      )}
    </div>
  );
}
