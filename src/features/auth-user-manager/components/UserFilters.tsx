'use client'

import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import type { UserFilters } from '@/lib/types/user.types'
import { USER_STATUS, AUTH_PROVIDERS } from '@/lib/types/user.types'

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onApply: () => void
  onClear: () => void
  showFilters: boolean
  onToggle: () => void
}

export function UserFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  showFilters,
  onToggle,
}: UserFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.authProvider ||
    filters.createdAfter ||
    filters.createdBefore ||
    filters.lastSignInAfter ||
    filters.lastSignInBefore

  /**
   * Sanitize search input to prevent XSS attacks
   * Removes HTML tags and special characters
   */
  const sanitizeSearchInput = (value: string): string => {
    // Remove HTML tags and special characters
    return value.replace(/[<>]/g, '').trim()
  }

  const handleSearchChange = (value: string) => {
    const sanitized = sanitizeSearchInput(value)
    onFiltersChange({ ...filters, search: sanitized })
  }

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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by email or name"
                    maxLength={100}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  >
                    {USER_STATUS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Auth Provider
                  </label>
                  <select
                    value={filters.authProvider}
                    onChange={(e) => onFiltersChange({ ...filters, authProvider: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  >
                    {AUTH_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Created After
                  </label>
                  <input
                    type="date"
                    value={filters.createdAfter}
                    onChange={(e) => onFiltersChange({ ...filters, createdAfter: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Created Before
                  </label>
                  <input
                    type="date"
                    value={filters.createdBefore}
                    onChange={(e) => onFiltersChange({ ...filters, createdBefore: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Sign In After
                  </label>
                  <input
                    type="date"
                    value={filters.lastSignInAfter}
                    onChange={(e) => onFiltersChange({ ...filters, lastSignInAfter: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Sign In Before
                  </label>
                  <input
                    type="date"
                    value={filters.lastSignInBefore}
                    onChange={(e) => onFiltersChange({ ...filters, lastSignInBefore: e.target.value })}
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
