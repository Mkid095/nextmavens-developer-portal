/**
 * Results Table Pagination Component
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  rowCount: number
  setCurrentPage: (page: number) => void
}

export function Pagination({ currentPage, totalPages, pageSize, rowCount, setCurrentPage }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
      <div className="text-xs text-slate-600">
        Showing {currentPage * pageSize + 1} to{' '}
        {Math.min((currentPage + 1) * pageSize, rowCount)} of{' '}
        {rowCount} results
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
          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage === totalPages - 1}
          className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4 text-slate-700" />
        </button>
      </div>
    </div>
  )
}
