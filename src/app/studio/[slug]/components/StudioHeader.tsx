/**
 * Studio Header Component
 * Header with navigation and action buttons
 */

import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

interface StudioHeaderProps {
  activeNav: string
  projectSlug: string
  selectedTable: string | null
  tableData: any
  selectedUserId: string | null
}

export function StudioHeader({
  activeNav,
  projectSlug,
  selectedTable,
  tableData,
  selectedUserId,
}: StudioHeaderProps) {
  const getTitle = () => {
    if (activeNav === 'users') return 'Users'
    if (activeNav === 'sql') return 'SQL Query'
    return selectedTable || 'Select a table'
  }

  const getSubtitle = () => {
    if (tableData && activeNav === 'tables') {
      return `${tableData.total} rows • ${tableData.columns.length} columns`
    }
    if (activeNav === 'users' && !selectedUserId) {
      return 'Manage application users'
    }
    if (activeNav === 'users' && selectedUserId) {
      return 'User details'
    }
    if (activeNav === 'sql') {
      return 'Execute SQL queries on your database'
    }
    return null
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectSlug}`}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{getTitle()}</h1>
            {getSubtitle() && (
              <p className="text-sm text-slate-500">{getSubtitle()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeNav === 'tables' && (
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Row</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
