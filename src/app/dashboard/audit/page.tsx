'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LogOut,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type {
  AuditLogApiResponse,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogQueryParams,
} from '@/lib/types/audit.types'
import { AuditFilters, AuditLogTable, Pagination, exportAuditLogsToCSV } from '@/features/audit-logs'
import { ACTION_TYPES, TARGET_TYPES } from '@/lib/types/audit.types'

/**
 * Validate ISO date string format
 */
function isValidISODate(dateString: string): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

const AUDIT_API_URL = process.env.NEXT_PUBLIC_AUDIT_API_URL || 'http://localhost:8080/api/audit'
const RESULTS_PER_PAGE = 50

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
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [developer, setDeveloper] = useState<{ id: string; name: string; email: string } | null>(null)

  const [pagination, setPagination] = useState({
    total: 0,
    limit: RESULTS_PER_PAGE,
    offset: 0,
    has_more: false,
  })

  const [filters, setFilters] = useState<AuditLogFilters>({
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
  })

  const [showFilters, setShowFilters] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDeveloperData()
    fetchAuditLogs()
  }, [router])

  const fetchDeveloperData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/developer/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
        }
        return
      }

      const data = await res.json()
      setDeveloper(data.developer)
    } catch (err) {
      console.error('Failed to fetch developer:', err)
    }
  }

  const fetchAuditLogs = async (offsetParam: number = 0) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Validate and sanitize filter values
      const validActions = new Set(ACTION_TYPES.map(t => t.value))
      const validTargetTypes = new Set(TARGET_TYPES.map(t => t.value))

      const params: AuditLogQueryParams = {
        limit: RESULTS_PER_PAGE,
        offset: offsetParam,
      }

      // Only add validated filter values
      if (filters.action && validActions.has(filters.action as any)) {
        params.action = filters.action
      }
      if (filters.targetType && validTargetTypes.has(filters.targetType as any)) {
        params.target_type = filters.targetType
      }
      if (filters.startDate && isValidISODate(filters.startDate)) {
        params.start_date = filters.startDate
      }
      if (filters.endDate && isValidISODate(filters.endDate)) {
        params.end_date = filters.endDate
      }

      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = String(value)
          }
          return acc
        }, {} as Record<string, string>)
      ).toString()

      const res = await fetch(`${AUDIT_API_URL}?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
          throw new Error('Authentication expired')
        }
        // Don't expose detailed error messages to prevent information disclosure
        throw new Error('Failed to fetch audit logs. Please try again later.')
      }

      const data: AuditLogApiResponse = await res.json()
      setLogs(data.data)
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        has_more: data.pagination.has_more,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs'
      setError(message)
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    setExpandedRows(new Set())
    fetchAuditLogs(0)
  }

  const handleClearFilters = () => {
    setFilters({
      action: '',
      targetType: '',
      startDate: '',
      endDate: '',
    })
    setExpandedRows(new Set())
    setTimeout(() => fetchAuditLogs(0), 0)
  }

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

  const handlePageChange = (newOffset: number) => {
    setExpandedRows(new Set())
    fetchAuditLogs(newOffset)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <span className="text-sm text-slate-600">{developer?.name}</span>
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
