/**
 * BackupNav Component
 *
 * Navigation bar for the backup settings page.
 */

'use client';

import Link from 'next/link';
import { LogOut, ArrowLeft } from 'lucide-react';

interface BackupNavProps {
  projectName?: string;
  developerName?: string;
}

export function BackupNav({ projectName, developerName }: BackupNavProps) {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          {projectName && (
            <div className="h-6 w-px bg-slate-300"></div>
          )}
          {projectName && (
            <span className="text-sm font-medium text-slate-900">{projectName}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {developerName && (
            <span className="text-sm text-slate-600">{developerName}</span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
