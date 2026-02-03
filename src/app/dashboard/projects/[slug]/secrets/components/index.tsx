/**
 * Secrets Page Components
 * Sub-components for the secrets management page
 */

'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Search, Filter, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { SecretCard } from './SecretCard'

interface PageHeaderProps {
  projectSlug: string
  projectName: string | undefined
  onCreateSecret: () => void
}

export function PageHeader({ projectSlug, projectName, onCreateSecret }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/projects/${projectSlug}`}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Secrets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage sensitive configuration for {projectName}
          </p>
        </div>
      </div>
      <button
        onClick={onCreateSecret}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Secret
      </button>
    </div>
  )
}

interface ErrorStateProps {
  error: string
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  )
}

interface SecretFiltersProps {
  searchQuery: string
  filterActive: boolean | null
  onSearchChange: (value: string) => void
  onFilterChange: (value: boolean | null) => void
}

export function SecretFilters({ searchQuery, filterActive, onSearchChange, onFilterChange }: SecretFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search secrets..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
          onChange={(e) => {
            const value = e.target.value
            onFilterChange(value === 'all' ? null : value === 'active')
          }}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">All Secrets</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  searchQuery: string
  filterActive: boolean | null
  onCreateSecret: () => void
}

export function EmptyState({ searchQuery, filterActive, onCreateSecret }: EmptyStateProps) {
  const hasFilters = searchQuery || filterActive !== null

  return (
    <div className="text-center py-12">
      <Key className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {hasFilters ? 'No secrets found' : 'No secrets yet'}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {hasFilters
          ? 'Try adjusting your search or filters'
          : 'Create your first secret to get started'
        }
      </p>
      {!hasFilters && (
        <button
          onClick={onCreateSecret}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Secret
        </button>
      )}
    </div>
  )
}

interface ToastProps {
  toast: { message: string; type: 'success' | 'error' } | null
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
        toast.type === 'success'
          ? 'bg-emerald-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span>{toast.message}</span>
    </motion.div>
  )
}

export { SecretCard }
