/**
 * Table Node Component
 * Individual table node with expandable columns, indexes, and foreign keys
 */

'use client'

import { ChevronRight, ChevronDown, Table, Key, Link2, Star, ShieldCheck } from 'lucide-react'
import type { DatabaseColumn, DatabaseIndex, DatabaseForeignKey } from './types'
import { getDataTypeIcon, getDataTypeColor } from './utils'

interface TableNodeProps {
  table: {
    name: string
    columns?: DatabaseColumn[]
    row_count?: number
  }
  isExpanded: boolean
  isSelected: boolean
  rowCount: number | undefined
  isLoadingRowCount: boolean
  tableIndexes: DatabaseIndex[] | undefined
  loadingIndexes: boolean
  tableForeignKeys: DatabaseForeignKey[] | undefined
  loadingForeignKeys: boolean
  onToggle: () => void
}

export function TableNode({
  table,
  isExpanded,
  isSelected,
  rowCount,
  isLoadingRowCount,
  tableIndexes,
  loadingIndexes,
  tableForeignKeys,
  loadingForeignKeys,
  onToggle,
}: TableNodeProps) {
  const DataTypeIcon = getDataTypeIcon(table.columns?.[0]?.data_type || '')

  return (
    <div className="select-none">
      {/* Table Row */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition ${
          isSelected ? 'bg-emerald-50' : ''
        }`}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
        <Table className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-900 flex-1 text-left">
          {table.name}
        </span>
        {isLoadingRowCount ? (
          <div className="w-12 h-3 border border-slate-200 rounded animate-pulse bg-slate-100" />
        ) : rowCount !== undefined ? (
          <span className="text-xs text-slate-400">{rowCount.toLocaleString()} rows</span>
        ) : null}
      </button>

      {/* Columns (Expandable) */}
      {isExpanded && table.columns && (
        <div className="pl-10 pr-4 pb-2 space-y-1">
          {table.columns.map((column) => {
            const ColumnIcon = getDataTypeIcon(column.data_type)

            return (
              <div
                key={column.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 transition"
              >
                <ColumnIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700">
                  {column.name}
                </span>
                <span className={`text-xs ${getDataTypeColor(column.data_type)} font-mono`}>
                  {column.data_type}
                </span>
                {column.is_nullable && (
                  <span className="ml-auto text-xs text-slate-400">nullable</span>
                )}
                {column.column_default && (
                  <span
                    className="ml-2 text-xs text-slate-400 truncate max-w-32"
                    title={`default: ${column.column_default}`}
                  >
                    = {column.column_default}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Indexes Section */}
      {isExpanded && (
        <div className="pl-10 pr-4 pb-2 space-y-1">
          {loadingIndexes ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
              <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading indexes...</span>
            </div>
          ) : tableIndexes && tableIndexes.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 mt-2">
                Indexes
              </div>
              {tableIndexes.map((index) => (
                <div
                  key={index.index_name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 transition"
                >
                  <Key className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-700 flex-1">
                    {index.index_name}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-48 font-mono" title={index.index_def}>
                    {index.index_def}
                  </span>
                  {index.is_primary && (
                    <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  )}
                  {index.is_unique && !index.is_primary && (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </>
          ) : null}
        </div>
      )}

      {/* Foreign Keys Section */}
      {isExpanded && (
        <div className="pl-10 pr-4 pb-2 space-y-1">
          {loadingForeignKeys ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
              <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading foreign keys...</span>
            </div>
          ) : tableForeignKeys && tableForeignKeys.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 mt-2">
                Foreign Keys
              </div>
              {tableForeignKeys.map((fk) => (
                <div
                  key={fk.constraint_name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 transition"
                >
                  <Link2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-700">
                    {fk.column_name}
                  </span>
                  <span className="text-xs text-slate-400">→</span>
                  <span className="text-xs font-medium text-slate-900">
                    {fk.foreign_table}.{fk.foreign_column}
                  </span>
                </div>
              ))}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
