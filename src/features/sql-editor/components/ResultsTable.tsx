'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
} from 'lucide-react'

export interface QueryResult {
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  executionTime: number
}

interface ResultsTableProps {
  result: QueryResult | null
  isLoading?: boolean
  error?: string | null
  pageSize?: number
}

type SortDirection = 'asc' | 'desc' | null

interface SortState {
  column: string | null
  direction: SortDirection
}

/**
 * ResultsTable Component
 *
 * Displays SQL query results in an interactive table with sorting, pagination,
 * column resizing, empty state handling, and CSV export.
 *
 * US-003: Create Results Table Component
 */
export function ResultsTable({
  result,
  isLoading = false,
  error = null,
  pageSize = 50,
}: ResultsTableProps) {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const tableRef = useRef<HTMLDivElement>(null)

  // Sort and paginate data
  const { sortedRows, totalPages } = useMemo(() => {
    if (!result || result.rows.length === 0) {
      return { sortedRows: [], totalPages: 0 }
    }

    let processedRows = [...result.rows]

    // Apply sorting
    if (sortState.column && sortState.direction) {
      processedRows.sort((a, b) => {
        const aVal = a[sortState.column]
        const bVal = b[sortState.column]

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

  // Handle column resize start
  const handleResizeStart = (
    e: React.MouseEvent,
    column: string,
    currentWidth: number
  ) => {
    e.preventDefault()
    setResizingColumn(column)
    setResizeStartX(e.clientX)
    setResizeStartWidth(currentWidth)
  }

  // Handle column resize move
  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX
      const newWidth = Math.max(50, resizeStartWidth + deltaX)

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  // Export to CSV
  const handleExportCSV = () => {
    if (!result || result.rows.length === 0) return

    const headers = result.columns
    const rows = result.rows

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const val = row[header]
            // Handle values that contain commas or quotes
            if (val == null) return ''
            const strVal = String(val)
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
              return `"${strVal.replace(/"/g, '""')}"`
            }
            return strVal
          })
          .join(',')
      ),
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `query-results-${Date.now()}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-600">Executing query...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="border border-red-200 rounded-lg bg-red-50">
        <div className="p-4">
          <p className="text-sm text-red-800 font-medium">Query Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Empty state (no result)
  if (!result) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Run a query to see results here
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Empty result state (query returned no data)
  if (result.rows.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Results
          </span>
          <span className="text-xs text-slate-500">
            {result.executionTime}ms • 0 rows
          </span>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Query executed successfully but returned no results
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { columns } = result

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Results header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Results
          </span>
          <span className="text-xs text-slate-500">
            {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} • {result.executionTime}ms
          </span>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="Export to CSV"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column, idx) => {
                const width = columnWidths[column] || 150
                const isSorted = sortState.column === column

                return (
                  <th
                    key={column}
                    className="relative group border-r border-slate-200 last:border-r-0"
                    style={{ width: `${width}px`, minWidth: `${width}px` }}
                  >
                    <div className="flex items-center px-4 py-2 cursor-pointer select-none">
                      <button
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide hover:text-emerald-700 transition flex-1 text-left"
                      >
                        <span className="truncate">{column}</span>
                        {isSorted && (
                          <ArrowUpDown
                            className={`w-3 h-3 flex-shrink-0 ${
                              sortState.direction === 'desc'
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        )}
                      </button>
                    </div>

                    {/* Resize handle */}
                    <div
                      className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-emerald-500 group-hover:bg-emerald-300 transition-colors ${
                        resizingColumn === column ? 'bg-emerald-500' : ''
                      }`}
                      onMouseDown={(e) =>
                        handleResizeStart(e, column, width)
                      }
                    />
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                {columns.map((column) => {
                  const value = row[column]
                  return (
                    <td
                      key={column}
                      className="px-4 py-2 text-sm text-slate-700 border-r border-slate-100 last:border-r-0"
                    >
                      {value == null ? (
                        <span className="text-slate-400 italic">null</span>
                      ) : typeof value === 'object' ? (
                        <span className="text-slate-600">
                          {JSON.stringify(value)}
                        </span>
                      ) : (
                        <span className="truncate block">{String(value)}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-600">
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, result.rowCount)} of{' '}
            {result.rowCount} results
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number

                // Show pages around current page
                if (totalPages <= 7) {
                  pageNum = i
                } else if (currentPage < 3) {
                  pageNum = i
                } else if (currentPage > totalPages - 4) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition ${
                      currentPage === pageNum
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage === totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
