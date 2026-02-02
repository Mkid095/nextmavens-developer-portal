/**
 * Table Header Component
 * Header section with database icon and table count
 */

'use client'

import { Database } from 'lucide-react'

interface TableHeaderProps {
  filteredCount: number
  totalCount: number
}

export function TableHeader({ filteredCount, totalCount }: TableHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-900">Database Schema</h3>
        <span className="ml-auto text-xs text-slate-500">
          {filteredCount} of {totalCount} table{totalCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
