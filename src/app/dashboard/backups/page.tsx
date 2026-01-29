/**
 * Backup Settings Page
 *
 * US-005: Create Backup UI
 *
 * Provides a comprehensive backup management interface including:
 * - Backup history display
 * - Export database button
 * - Export logs button
 * - Send to Telegram button
 * - Backup size and date information
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import {
  BackupNav,
  BackupStatsCards,
  BackupActions,
  BackupTable,
  useBackups,
} from '@/features/backups';
import type { Backup } from '@nextmavens/audit-logs-database';

interface Developer {
  id: string;
  email: string;
  name: string;
  organization?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

export default function BackupSettingsPage() {
  const router = useRouter();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const {
    backups,
    stats,
    loading: backupsLoading,
    error: backupsError,
    operation,
    pagination,
    refresh,
    handleExportDatabase,
    handleExportLogs,
    handleSendToTelegram,
    handleDeleteBackup,
    handlePageChange,
  } = useBackups({
    projectId: project?.id ?? '',
    autoFetch: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDeveloperData();
  }, [router]);

  useEffect(() => {
    if (project?.id) {
      refresh();
    }
  }, [project?.id, refresh]);

  const fetchDeveloperData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/developer/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear();
          router.push('/login');
        }
        return;
      }

      const data = await res.json();
      setDeveloper(data.developer);

      if (data.developer && res.ok && token) {
        await fetchProjectData(token);
      }
    } catch (err) {
      console.error('Failed to fetch developer:', err);
      addToast('error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectData = async (token: string) => {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.projects && data.projects.length > 0) {
          setProject(data.projects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <BackupNav developerName={developer?.name} projectName={project?.name} />

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-2">Backup Settings</h1>
              <p className="text-slate-600">
                Manage your database and log backups
              </p>
            </div>
          </div>

          {!project ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No Project Found</h3>
                <p className="text-slate-500 text-sm mb-4">
                  You need to create a project first to manage backups
                </p>
              </div>
            </div>
          ) : (
            <>
              <BackupStatsCards stats={stats} />

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Backup</h2>
                <BackupActions
                  operation={operation}
                  onExportDatabase={handleExportDatabase}
                  onExportLogs={handleExportLogs}
                />
              </div>

              {backupsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900">Error loading backups</h3>
                    <p className="text-sm text-red-700 mt-1">{backupsError}</p>
                  </div>
                </div>
              )}

              {backupsLoading && backups.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                    <span className="text-slate-600">Loading backups...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Backup History</h2>
                    <BackupTable
                      backups={backups}
                      onSendToTelegram={handleSendToTelegram}
                      onDelete={handleDeleteBackup}
                    />
                  </div>

                  {pagination.total > pagination.limit && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} backups
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                          disabled={pagination.offset === 0}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                          disabled={!pagination.hasMore}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      </main>

      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
              }`}
            >
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
