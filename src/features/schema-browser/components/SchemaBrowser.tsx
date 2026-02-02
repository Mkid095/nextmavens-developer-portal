'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Table,
  Database,
  Key,
  Hash,
  FileText,
  ShieldCheck,
  Star,
  Link2,
  Search,
  X,
} from 'lucide-react'

export interface DatabaseColumn {
  name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
}

export interface DatabaseIndex {
  index_name: string
  index_def: string
  is_unique: boolean
  is_primary: boolean
}

export interface DatabaseForeignKey {
  constraint_name: string
  column_name: string
  foreign_table: string
  foreign_column: string
}

export interface DatabaseTable {
  name: string
  columns?: DatabaseColumn[]
  indexes?: DatabaseIndex[]
  foreign_keys?: DatabaseForeignKey[]
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
 * - Search box for filtering tables
 * - Row counts for each table
 * - Columns with details (expandable)
 * - Indexes with details (expandable)
 * - Foreign keys with details (expandable)
 * - Color-coded data types
 * - Visual indicators for nullable/primary keys
 *
 * US-001: Create Schema Browser Component
 * US-006: Display Indexes
 * US-008: Display Foreign Keys
 * US-009: Search Tables
 * US-010: Show Row Count
 */
export function SchemaBrowser({
  projectId,
  schemaData,
  loading = false,
  onTableSelect,
  selectedTable,
}: SchemaBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [expandedIndexes, setExpandedIndexes] = useState<Set<string>>(new Set())
  const [tableIndexes, setTableIndexes] = useState<Map<string, DatabaseIndex[]>>(new Map())
  const [loadingIndexes, setLoadingIndexes] = useState<Set<string>>(new Set())
  const [tableForeignKeys, setTableForeignKeys] = useState<Map<string, DatabaseForeignKey[]>>(new Map())
  const [loadingForeignKeys, setLoadingForeignKeys] = useState<Set<string>>(new Set())
  const [tableRowCounts, setTableRowCounts] = useState<Map<string, number>>(new Map())
  const [loadingRowCounts, setLoadingRowCounts] = useState<Set<string>>(new Set())

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    if (!schemaData) return []
    if (!searchQuery.trim()) return schemaData.tables

    const query = searchQuery.toLowerCase()
    return schemaData.tables.filter(table =>
      table.name.toLowerCase().includes(query)
    )
  }, [schemaData, searchQuery])

  // Fetch indexes when a table is expanded
  useEffect(() => {
    expandedTables.forEach(async (tableName) => {
      // Skip if we already fetched indexes for this table
      if (tableIndexes.has(tableName)) {
        return
      }

      // Skip if already loading
      if (loadingIndexes.has(tableName)) {
        return
      }

      // Mark as loading
      setLoadingIndexes(prev => new Set(prev).add(tableName))

      try {
        const response = await fetch(
          `/api/studio/${projectId}/tables/${tableName}/indexes`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setTableIndexes(prev => new Map(prev).set(tableName, data.indexes))
        }
      } catch (error) {
        console.error(`Failed to fetch indexes for ${tableName}:`, error)
      } finally {
        setLoadingIndexes(prev => {
          const newSet = new Set(prev)
          newSet.delete(tableName)
          return newSet
        })
      }
    })
  }, [expandedTables, projectId, tableIndexes, loadingIndexes])

  // Fetch foreign keys when a table is expanded
  useEffect(() => {
    expandedTables.forEach(async (tableName) => {
      // Skip if we already fetched foreign keys for this table
      if (tableForeignKeys.has(tableName)) {
        return
      }

      // Skip if already loading
      if (loadingForeignKeys.has(tableName)) {
        return
      }

      // Mark as loading
      setLoadingForeignKeys(prev => new Set(prev).add(tableName))

      try {
        const response = await fetch(
          `/api/studio/${projectId}/tables/${tableName}/foreign-keys`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setTableForeignKeys(prev => new Map(prev).set(tableName, data.foreignKeys))
        }
      } catch (error) {
        console.error(`Failed to fetch foreign keys for ${tableName}:`, error)
      } finally {
        setLoadingForeignKeys(prev => {
          const newSet = new Set(prev)
          newSet.delete(tableName)
          return newSet
        })
      }
    })
  }, [expandedTables, projectId, tableForeignKeys, loadingForeignKeys])

  // Fetch row counts for all tables when schema data is loaded
  useEffect(() => {
    if (!schemaData || schemaData.tables.length === 0) {
      return
    }

    schemaData.tables.forEach(async (table) => {
      // Skip if we already fetched row count for this table
      if (tableRowCounts.has(table.name)) {
        return
      }

      // Skip if table already has row_count from the server
      if (table.row_count !== undefined) {
        setTableRowCounts(prev => new Map(prev).set(table.name, table.row_count!))
        return
      }

      // Skip if already loading
      if (loadingRowCounts.has(table.name)) {
        return
      }

      // Mark as loading
      setLoadingRowCounts(prev => new Set(prev).add(table.name))

      try {
        const response = await fetch(
          `/api/studio/${projectId}/tables/${table.name}/row-count`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setTableRowCounts(prev => new Map(prev).set(table.name, data.rowCount))
        }
      } catch (error) {
        console.error(`Failed to fetch row count for ${table.name}:`, error)
      } finally {
        setLoadingRowCounts(prev => {
          const newSet = new Set(prev)
          newSet.delete(table.name)
          return newSet
        })
      }
    })
  }, [schemaData, projectId, tableRowCounts, loadingRowCounts])

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

  // Display message if no tables match search
  if (filteredTables.length === 0 && searchQuery.trim()) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header with Search */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Database Schema</h3>
            <span className="ml-auto text-xs text-slate-500">
              {schemaData.tables.length} table{schemaData.tables.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Search Box */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tables..."
              className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* No Results Message */}
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Search className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm text-slate-600">No tables match "{searchQuery}"</p>
        </div>
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
            {filteredTables.length} of {schemaData.tables.length} table{schemaData.tables.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Search Box */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Structure */}
      <div className="divide-y divide-slate-100">
        {filteredTables.map((table) => {
          const isExpanded = expandedTables.has(table.name)
          const isSelected = selectedTable === table.name
          const DataTypeIcon = getDataTypeIcon(table.columns?.[0]?.data_type || '')
          const rowCount = table.row_count ?? tableRowCounts.get(table.name)
          const isLoadingRowCount = loadingRowCounts.has(table.name)

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
                  {loadingIndexes.has(table.name) ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading indexes...</span>
                    </div>
                  ) : tableIndexes.get(table.name) && tableIndexes.get(table.name)!.length > 0 ? (
                    <>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 mt-2">
                        Indexes
                      </div>
                      {tableIndexes.get(table.name)!.map((index) => (
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
                  {loadingForeignKeys.has(table.name) ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading foreign keys...</span>
                    </div>
                  ) : tableForeignKeys.get(table.name) && tableForeignKeys.get(table.name)!.length > 0 ? (
                    <>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 mt-2">
                        Foreign Keys
                      </div>
                      {tableForeignKeys.get(table.name)!.map((fk) => (
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
        })}
      </div>
    </div>
  )
}
