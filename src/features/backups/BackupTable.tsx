/**
 * BackupTable Component
 *
 * Displays a list of backups with their details and actions.
 */

'use client';

import { Database, HardDrive, FileText, Clock, Trash2, Send } from 'lucide-react';
import type { Backup } from '@nextmavenspacks/audit-logs-database';
import {
  formatFileSize,
  formatDate,
  getBackupTypeLabel,
  getBackupTypeColor,
  isExpiringSoon,
} from './types';

interface BackupTableProps {
  backups: Backup[];
  onSendToTelegram: (backupId: string) => void;
  onDelete: (backupId: string) => void;
}

export function BackupTable({ backups, onSendToTelegram, onDelete }: BackupTableProps) {
  if (backups.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="text-center">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No backups yet</h3>
          <p className="text-slate-500 text-sm">Create your first backup to get started</p>
        </div>
      </div>
    );
  }

  const getBackupIcon = (type: string) => {
    switch (type) {
      case 'database':
        return Database;
      case 'storage':
        return HardDrive;
      case 'logs':
        return FileText;
      default:
        return Database;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {backups.map((backup) => {
              const Icon = getBackupIcon(backup.type);
              const expiringSoon = isExpiringSoon(backup.expires_at);
              const isExpired = backup.expires_at < new Date();

              return (
                <tr key={backup.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getBackupTypeColor(backup.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {getBackupTypeLabel(backup.type)}
                      </span>
                      {expiringSoon && !isExpired && (
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                          Expiring soon
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Expired
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{formatFileSize(backup.size)}</span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {formatDate(backup.created_at)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${isExpired ? 'text-red-600' : 'text-slate-600'}`}>
                      {formatDate(backup.expires_at)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSendToTelegram(backup.id)}
                        disabled={isExpired}
                        className="p-2 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send to Telegram"
                      >
                        <Send className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => onDelete(backup.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Delete backup"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
