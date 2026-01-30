'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Table,
  Database,
  Key,
  Hash,
  FileText,
} from 'lucide-react'

export interface DatabaseColumn {
  name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
}

export interface DatabaseTable {
  name: string
  columns?: DatabaseColumn[]
  row_count?: number
}

export interface SchemaData {
  tables: DatabaseTable[]
}

interface SchemaBrowserProps {
  projectId: string
  schemaData: SchemaData | null
  loading?: boolean
  onTableSelect?: (tableName: string) => void
  selectedTable?: string | null
}

/**
 * SchemaBrowser Component
 *
 * Displays database schema in a tree structure with:
 * - Tables list (expandable)
 * - Columns with details (expandable)
 * - Color-coded data types
 * - Visual indicators for nullable/primary keys
 *
 * US-001: Create Schema Browser Component
 */
export function SchemaBrowser({
  projectId,
  schemaData,
  loading = false,
  onTableSelect,
  selectedTable,
}: SchemaBrowserProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
      if (onTableSelect) {
        onTableSelect(tableName)
      }
    }
    setExpandedTables(newExpanded)
  }

  const getDataTypeColor = (dataType: string): string => {
    const type = dataType.toLowerCase()
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
      return 'text-blue-600'
    }
    if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
      return 'text-green-600'
    }
    if (type.includes('bool')) {
      return 'text-purple-600'
    }
    if (type.includes('date') || type.includes('time')) {
      return 'text-orange-600'
    }
    if (type.includes('json') || type.includes('jsonb')) {
      return 'text-pink-600'
    }
    return 'text-slate-600'
  }

  const getDataTypeIcon = (dataType: string) => {
    const type = dataType.toLowerCase()
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
      return Hash
    }
    if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
      return FileText
    }
    return Key
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!schemaData || schemaData.tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Database className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-sm text-slate-600">No tables found in database</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Database Schema</h3>
          <span className="ml-auto text-xs text-slate-500">
            {schemaData.tables.length} table{schemaData.tables.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Tree Structure */}
      <div className="divide-y divide-slate-100">
        {schemaData.tables.map((table) => {
          const isExpanded = expandedTables.has(table.name)
          const isSelected = selectedTable === table.name
          const DataTypeIcon = getDataTypeIcon(table.columns?.[0]?.data_type || '')

          return (
            <div key={table.name} className="select-none">
              {/* Table Row */}
              <button
                onClick={() => toggleTable(table.name)}
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
                {table.row_count !== undefined && (
                  <span className="text-xs text-slate-400">{table.row_count} rows</span>
                )}
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
