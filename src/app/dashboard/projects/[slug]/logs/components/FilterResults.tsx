/**
 * FilterResults Component
 *
 * Results count and load more button for logs.
 */

'use client'

import React from 'react'
import { Loader2, ChevronDown } from 'lucide-react'

interface FilterResultsProps {
  filteredCount: number
  totalCount: number
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

export function FilterResults({
  filteredCount,
  totalCount,
  hasMore,
  loadingMore,
  onLoadMore,
}: FilterResultsProps) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <div className="text-sm text-slate-500">
        Showing {filteredCount} of {totalCount} log entries
      </div>
      <div className="flex items-center gap-3">
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
