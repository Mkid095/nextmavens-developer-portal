'use client'

import { useState, useMemo } from 'react'
import type { SchemaBrowserProps } from './types'
import { useSchemaBrowserData } from './hooks'
import { TableNode, SearchBar, TableHeader, EmptyState } from './index'

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

  const {
    tableIndexes,
    loadingIndexes,
    tableForeignKeys,
    loadingForeignKeys,
    tableRowCounts,
    loadingRowCounts,
  } = useSchemaBrowserData({ projectId, expandedTables, schemaData })

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    if (!schemaData) return []
    if (!searchQuery.trim()) return schemaData.tables

    const query = searchQuery.toLowerCase()
    return schemaData.tables.filter(table =>
      table.name.toLowerCase().includes(query)
    )
  }, [schemaData, searchQuery])

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

  // Loading state
  if (loading) {
    return <EmptyState type="loading" />
  }

  // No tables state
  if (!schemaData || schemaData.tables.length === 0) {
    return <EmptyState type="no-tables" />
  }

  // No search results state
  if (filteredTables.length === 0 && searchQuery.trim()) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <TableHeader filteredCount={filteredTables.length} totalCount={schemaData.tables.length} />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <EmptyState type="no-results" searchQuery={searchQuery} tableCount={schemaData.tables.length} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <TableHeader filteredCount={filteredTables.length} totalCount={schemaData.tables.length} />

      {/* Search Box */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Tree Structure */}
      <div className="divide-y divide-slate-100">
        {filteredTables.map((table) => {
          const isExpanded = expandedTables.has(table.name)
          const isSelected = selectedTable === table.name
          const rowCount = table.row_count ?? tableRowCounts.get(table.name)
          const isLoadingRowCount = loadingRowCounts.has(table.name)

          return (
            <TableNode
              key={table.name}
              table={table}
              isExpanded={isExpanded}
              isSelected={isSelected}
              rowCount={rowCount}
              isLoadingRowCount={isLoadingRowCount}
              tableIndexes={tableIndexes.get(table.name)}
              loadingIndexes={loadingIndexes.has(table.name)}
              tableForeignKeys={tableForeignKeys.get(table.name)}
              loadingForeignKeys={loadingForeignKeys.has(table.name)}
              onToggle={() => toggleTable(table.name)}
            />
          )
        })}
      </div>
    </div>
  )
}
