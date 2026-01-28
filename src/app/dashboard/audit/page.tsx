'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { AuditFilters, AuditLogTable, Pagination, exportAuditLogsToCSV, AuditNav, useAuditLogs } from '@/features/audit-logs'

/**
 * SECURITY NOTE: localStorage Token Storage
 *
 * This application uses localStorage for JWT token storage, which has security implications:
 *
 * RISK: Tokens stored in localStorage are accessible to any JavaScript code, making them
 * vulnerable to XSS attacks. If an attacker can inject malicious scripts (e.g., through
 * unsanitized user input), they can steal the access token.
 *
 * MITIGATIONS IN PLACE:
 * 1. All user input is sanitized before display (see AuditLogTable.tsx)
 * 2. Metadata is deeply sanitized to prevent XSS
 * 3. Content Security Policy should be configured in next.config.js
 * 4. Tokens are cleared on 401 responses
 *
 * RECOMMENDED IMPROVEMENTS:
 * 1. Use httpOnly cookies for token storage (requires backend changes)
 * 2. Implement token rotation/refresh mechanism
 * 3. Add Content-Security-Policy headers
 * 4. Consider using sessionStorage instead (clears on tab close)
 *
 * Current implementation prioritizes defense-in-depth through input sanitization
 * and proper escaping. Monitor for CSP policy implementation.
 */

export default function AuditLogViewerPage() {
  const {
    logs,
    loading,
    error,
    developer,
    pagination,
    filters,
    setFilters,
    handleApplyFilters,
    handleClearFilters,
    handlePageChange,
  } = useAuditLogs()

  const [showFilters, setShowFilters] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const handleExportToCSV = () => {
    exportAuditLogsToCSV(logs)
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <AuditNav developerName={developer?.name} />

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-2">Audit Logs</h1>
              <p className="text-slate-600">View and search all audit activity</p>
            </div>
            <button
              onClick={handleExportToCSV}
              disabled={logs.length === 0 || loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <AuditFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            showFilters={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error loading audit logs</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                <span className="text-slate-600">Loading audit logs...</span>
              </div>
            </div>
          )}

          {!loading && (
            <>
              <AuditLogTable
                logs={logs}
                expandedRows={expandedRows}
                onToggleRow={toggleRowExpansion}
              />
              <Pagination
                total={pagination.total}
                limit={pagination.limit}
                offset={pagination.offset}
                hasMore={pagination.has_more}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}
