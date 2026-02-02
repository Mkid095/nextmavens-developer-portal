/**
 * Schema Browser Data Hook
 * Custom hook for managing schema browser data fetching
 */

import { useEffect, useState } from 'react'
import type { DatabaseIndex, DatabaseForeignKey } from '../types'

interface UseSchemaBrowserDataProps {
  projectId: string
  expandedTables: Set<string>
  schemaData: { tables: Array<{ name: string; row_count?: number }> } | null
}

export function useSchemaBrowserData({
  projectId,
  expandedTables,
  schemaData,
}: UseSchemaBrowserDataProps) {
  const [tableIndexes, setTableIndexes] = useState<Map<string, DatabaseIndex[]>>(new Map())
  const [loadingIndexes, setLoadingIndexes] = useState<Set<string>>(new Set())
  const [tableForeignKeys, setTableForeignKeys] = useState<Map<string, DatabaseForeignKey[]>>(new Map())
  const [loadingForeignKeys, setLoadingForeignKeys] = useState<Set<string>>(new Set())
  const [tableRowCounts, setTableRowCounts] = useState<Map<string, number>>(new Map())
  const [loadingRowCounts, setLoadingRowCounts] = useState<Set<string>>(new Set())

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

  return {
    tableIndexes,
    loadingIndexes,
    tableForeignKeys,
    loadingForeignKeys,
    tableRowCounts,
    loadingRowCounts,
  }
}
