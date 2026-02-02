/**
 * Results Table Sorting/Pagination Hook
 */

import { useState, useMemo, useEffect } from 'react'
import type { QueryResult, SortState } from './types'

interface UseSortAndPaginateResult {
  sortedRows: Record<string, any>[]
  totalPages: number
  sortState: SortState
  currentPage: number
  setSortState: React.Dispatch<React.SetStateAction<SortState>>
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  handleSort: (column: string) => void
}

export function useSortAndPaginate(
  result: QueryResult | null,
  pageSize: number
): UseSortAndPaginateResult {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  })
  const [currentPage, setCurrentPage] = useState(0)

  // Sort and paginate data
  const { sortedRows, totalPages } = useMemo(() => {
    if (!result || result.rows.length === 0) {
      return { sortedRows: [], totalPages: 0 }
    }

    let processedRows = [...result.rows]

    // Apply sorting
    if (sortState.column && sortState.direction) {
      const column = sortState.column
      processedRows.sort((a, b) => {
        const aVal = a[column]
        const bVal = b[column]

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sortState.direction === 'asc' ? 1 : -1
        if (bVal == null) return sortState.direction === 'asc' ? -1 : 1

        // Compare based on type
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortState.direction === 'asc'
            ? aVal - bVal
            : bVal - aVal
        }

        // String comparison
        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        const comparison = aStr.localeCompare(bStr)

        return sortState.direction === 'asc' ? comparison : -comparison
      })
    }

    // Calculate total pages
    const pages = Math.ceil(processedRows.length / pageSize)

    // Apply pagination
    const startIdx = currentPage * pageSize
    const paginatedRows = processedRows.slice(startIdx, startIdx + pageSize)

    return { sortedRows: paginatedRows, totalPages: pages }
  }, [result, sortState, currentPage, pageSize])

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(0)
  }, [result])

  // Handle column sort
  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null }
        }
      }
      return { column, direction: 'asc' }
    })
    setCurrentPage(0)
  }

  return { sortedRows, totalPages, sortState, currentPage, setSortState, setCurrentPage, handleSort }
}
