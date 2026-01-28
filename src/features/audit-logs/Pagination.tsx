'use client'

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  onPageChange: (newOffset: number) => void
}

export function Pagination({ total, limit, offset, hasMore, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="text-sm text-slate-600">
        Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} entries
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 1}
          className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4 text-slate-600" />
        </button>
        <button
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={currentPage === 1}
          className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <span className="px-3 py-1 text-sm font-medium text-slate-900 bg-slate-100 rounded">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={!hasMore}
          className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
        <button
          onClick={() => onPageChange(Math.floor((total - 1) / limit) * limit)}
          disabled={!hasMore}
          className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  )
}
