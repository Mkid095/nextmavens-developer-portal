/**
 * Empty State Component
 * Empty state for schema browser
 */

'use client'

import { Database, Search } from 'lucide-react'

interface EmptyStateProps {
  type: 'loading' | 'no-tables' | 'no-results'
  searchQuery?: string
  tableCount?: number
  showHeader?: boolean
}

export function EmptyState({ type, searchQuery, tableCount, showHeader = false }: EmptyStateProps) {
  if (type === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (type === 'no-tables') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Database className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-sm text-slate-600">No tables found in database</p>
      </div>
    )
  }

  if (type === 'no-results') {
    return (
      <>
        {showHeader && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Database Schema</h3>
              <span className="ml-auto text-xs text-slate-500">
                {tableCount} table{tableCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Search className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm text-slate-600">No tables match "{searchQuery}"</p>
        </div>
      </>
    )
  }

  return null
}
