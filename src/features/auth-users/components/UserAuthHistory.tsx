'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, LogIn, LogOut, MapPin, Clock, Shield, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { EndUserAuthHistory } from '@/lib/types/auth-user.types'

interface UserAuthHistoryProps {
  userId: string
  loading: boolean
  error: string | null
  history?: EndUserAuthHistory[]
  total?: number
  limit?: number
  offset?: number
  onRefresh: () => void
  onPageChange: (offset: number) => void
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const getMethodBadge = (method: string, success: boolean) => {
  if (!success) {
    return (
      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
        Failed
      </span>
    )
  }

  const methodConfig = {
    email: { label: 'Email', color: 'bg-blue-100 text-blue-700' },
    google: { label: 'Google', color: 'bg-slate-100 text-slate-700' },
    github: { label: 'GitHub', color: 'bg-slate-800 text-white' },
    microsoft: { label: 'Microsoft', color: 'bg-blue-100 text-blue-700' },
  }

  const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.email

  return (
    <span className={`px-2 py-0.5 ${config.color} text-xs font-medium rounded`}>
      {config.label}
    </span>
  )
}

interface HistoryEntryProps {
  entry: EndUserAuthHistory
}

function HistoryEntry({ entry }: HistoryEntryProps) {
  return (
    <div
      className={`p-4 border rounded-lg ${
        entry.success
          ? 'bg-white border-slate-200 hover:border-slate-300'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          entry.success ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {entry.success ? (
            <LogIn className="w-5 h-5 text-emerald-700" />
          ) : (
            <Shield className="w-5 h-5 text-red-700" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {getMethodBadge(entry.method, entry.success)}
            <span className="text-xs text-slate-500">#{entry.id.slice(-8)}</span>
          </div>

          <div className="space-y-1.5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Signed in {formatDateTime(entry.sign_in_at)}</span>
              <span className="text-slate-400">•</span>
              <span>{getRelativeTime(entry.sign_in_at)}</span>
            </div>

            {entry.sign_out_at && (
              <div className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Signed out {formatDateTime(entry.sign_out_at)}</span>
                <span className="text-slate-400">•</span>
                <span>{getRelativeTime(entry.sign_out_at)}</span>
              </div>
            )}

            {entry.ip_address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{entry.ip_address}</span>
                {entry.location && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span>{entry.location}</span>
                  </>
                )}
              </div>
            )}

            {entry.device_type && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-500">Device:</span>
                <span>{entry.device_type}</span>
                {entry.browser && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span>{entry.browser}</span>
                  </>
                )}
              </div>
            )}

            {!entry.success && entry.failure_reason && (
              <div className="flex items-center gap-2 text-red-600">
                <Shield className="w-3.5 h-3.5" />
                <span>{entry.failure_reason}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PaginationProps {
  total: number
  limit: number
  offset: number
  onPageChange: (offset: number) => void
}

function Pagination({ total, limit, offset, onPageChange }: PaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
      <div className="text-sm text-slate-600">
        Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} entries
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange((pageNum - 1) * limit)}
                className={`w-8 h-8 text-sm font-medium rounded-lg transition ${
                  pageNum === currentPage
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function UserAuthHistory({
  loading,
  error,
  history,
  total = 0,
  limit = 20,
  offset = 0,
  onRefresh,
  onPageChange,
}: UserAuthHistoryProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Authentication History</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading && !history ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            <span className="text-slate-600">Loading authentication history...</span>
          </div>
        </div>
      ) : !history || history.length === 0 ? (
        <div className="p-12 text-center">
          <LogIn className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No authentication history</p>
          <p className="text-sm text-slate-400">
            This user has no authentication history records
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {history.map((entry) => (
              <HistoryEntry key={entry.id} entry={entry} />
            ))}
          </motion.div>

          <Pagination
            total={total}
            limit={limit}
            offset={offset}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}
