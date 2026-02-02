/**
 * Studio Sidebar Component
 * Sidebar navigation and table list
 */

import Link from 'next/link'
import { Search, Table, Database } from 'lucide-react'
import type { NavItem, DatabaseTable } from '../types'
import { NAV_ITEMS } from '../constants'

interface StudioSidebarProps {
  activeNav: string
  projectSlug: string
  searchQuery: string
  onNavChange: (navId: string) => void
  onSearchChange: (query: string) => void
  selectedTable: string | null
  tables: DatabaseTable[]
  onTableSelect: (tableName: string) => void
  filteredTables: DatabaseTable[]
}

export function StudioSidebar({
  activeNav,
  projectSlug,
  searchQuery,
  onNavChange,
  onSearchChange,
  selectedTable,
  tables,
  onTableSelect,
  filteredTables,
}: StudioSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900">Studio</span>
            <p className="text-xs text-slate-500">{projectSlug}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              activeNav === item.id
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Tables List */}
      {activeNav === 'tables' && (
        <div className="border-t border-slate-200">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>
          <div className="px-3 pb-3 max-h-64 overflow-y-auto">
            {filteredTables.map((table) => (
              <button
                key={table.name}
                onClick={() => onTableSelect(table.name)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                  selectedTable === table.name
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Table className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{table.name}</span>
              </button>
            ))}
            {filteredTables.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No tables found</p>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
