/**
 * BackupStatsCards Component
 *
 * Displays backup statistics in card format.
 */

'use client';

import { Database, HardDrive, FileText, Clock } from 'lucide-react';
import type { BackupStats } from '@nextmavenspacks/audit-logs-database';
import { formatFileSize } from './types';

interface BackupStatsCardsProps {
  stats: BackupStats | null;
}

export function BackupStatsCards({ stats }: BackupStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Backups',
      value: stats.total_backups.toString(),
      icon: Database,
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Total Size',
      value: formatFileSize(stats.total_size),
      icon: HardDrive,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Expiring Soon',
      value: stats.expiring_soon.toString(),
      icon: Clock,
      color: 'bg-amber-100 text-amber-700',
      highlight: stats.expiring_soon > 0,
    },
    {
      title: 'Database Backups',
      value: stats.by_type.database.toString(),
      icon: Database,
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-xl p-6 border border-slate-200 transition ${
              card.highlight ? 'border-amber-300' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-slate-900">{card.title}</span>
            </div>
            <div className="text-3xl font-semibold text-slate-900">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}
