'use client'

import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { Filter, ChevronDown, ChevronUp, Search } from 'lucide-react'
import type { EndUserListQuery, EndUserStatus, EndUserAuthProvider } from '@/lib/types/auth-user.types'

interface UserFilterBarProps {
  filters: EndUserListQuery
  onFiltersChange: (filters: EndUserListQuery) => void
  onApply: () => void
  onClear: () => void
  showFilters: boolean
  onToggle: () => void
}

const STATUS_OPTIONS: { value: EndUserStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'deleted', label: 'Deleted' },
]

const PROVIDER_OPTIONS: { value: EndUserAuthProvider | ''; label: string }[] = [
  { value: '', label: 'All Providers' },
  { value: 'email', label: 'Email' },
  { value: 'google', label: 'Google' },
  { value: 'github', label: 'GitHub' },
  { value: 'microsoft', label: 'Microsoft' },
]

export function UserFilterBar({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  showFilters,
  onToggle,
}: UserFilterBarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.auth_provider ||
    filters.created_after ||
    filters.created_before ||
    filters.last_sign_in_after ||
    filters.last_sign_in_before

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="font-medium text-slate-900">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded">
              Active
            </span>
          )}
        </div>
        {showFilters ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-slate-200 pt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Email Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search by Email
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filters.search || ''}
                      onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
                      placeholder="user@example.com"
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as EndUserStatus | undefined || undefined })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auth Provider Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Auth Provider
                  </label>
                  <select
                    value={filters.auth_provider || ''}
                    onChange={(e) => onFiltersChange({ ...filters, auth_provider: e.target.value as EndUserAuthProvider | undefined || undefined })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  >
                    {PROVIDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Created After */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Created After
                  </label>
                  <input
                    type="date"
                    value={filters.created_after || ''}
                    onChange={(e) => onFiltersChange({ ...filters, created_after: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                {/* Created Before */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Created Before
                  </label>
                  <input
                    type="date"
                    value={filters.created_before || ''}
                    onChange={(e) => onFiltersChange({ ...filters, created_before: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                {/* Last Sign In After */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Sign In After
                  </label>
                  <input
                    type="date"
                    value={filters.last_sign_in_after || ''}
                    onChange={(e) => onFiltersChange({ ...filters, last_sign_in_after: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                {/* Last Sign In Before */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Sign In Before
                  </label>
                  <input
                    type="date"
                    value={filters.last_sign_in_before || ''}
                    onChange={(e) => onFiltersChange({ ...filters, last_sign_in_before: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={onClear}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
                >
                  Clear Filters
                </button>
                <button
                  onClick={onApply}
                  className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
