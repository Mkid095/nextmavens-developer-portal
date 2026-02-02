/**
 * ResultsTable Component
 *
 * Displays SQL query results in an interactive table with sorting, pagination,
 * column resizing, empty state handling, and CSV export.
 *
 * US-003: Create Results Table Component
 * US-008: Show Query Stats (rowsAffected, queryPlan)
 */

'use client'

import { useRef } from 'react'
import { ArrowUpDown } from 'lucide-react'
import type { QueryResult, ResultsTableProps } from './types'
import { useSortAndPaginate } from './use-sort-and-paginate'
import { useColumnResize } from './use-column-resize'
import { handleExportCSV as exportCSV } from './csv-export'
import { LoadingState, ErrorState, EmptyState, NoResultsState } from './states'
import { Pagination } from './Pagination'
import { ResultsHeader } from './ResultsHeader'

export function ResultsTable({
  result,
  isLoading = false,
  error = null,
  pageSize = 50,
}: ResultsTableProps) {
  const {
    sortedRows,
    totalPages,
    sortState,
    currentPage,
    setCurrentPage,
    handleSort,
  } = useSortAndPaginate(result, pageSize)

  const { columnWidths, resizingColumn, handleResizeStart } = useColumnResize()

  // Export to CSV
  const handleExportCSV = () => {
    if (!result || result.rows.length === 0) return
    exportCSV(result)
  }

  // Loading state
  if (isLoading) {
    return <LoadingState />
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />
  }

  // Empty state (no result)
  if (!result) {
    return <EmptyState />
  }

  // Empty result state (query returned no data)
  if (result.rows.length === 0) {
    return <NoResultsState result={result} />
  }

  const { columns } = result

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <ResultsHeader result={result} onExport={handleExportCSV} />

      {/* Table container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => {
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        rowCount={result.rowCount}
        setCurrentPage={setCurrentPage}
      />
    </div>
  )
}
