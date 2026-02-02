/**
 * LogTable Component
 *
 * Table displaying logs with pagination and infinite scroll support.
 */

'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2 } from 'lucide-react'
import type { LogEntry as LogEntryType } from '../types'
import { LogEntry } from './LogEntry'

interface LogTableProps {
  filteredLogs: LogEntryType[]
  loadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  expandedLogId: string | null
  onToggleLogExpand: (logId: string) => void
  searchQuery: string
  connecting?: boolean
}

export function LogTable({
  filteredLogs,
  loadingMore,
  hasMore,
  onLoadMore,
  expandedLogId,
  onToggleLogExpand,
  searchQuery,
  connecting = false,
}: LogTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  // Auto-load on scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const trigger = loadMoreTriggerRef.current

    if (!scrollContainer || !trigger || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { root: scrollContainer, rootMargin: '200px', threshold: 0.1 }
    )

    observer.observe(trigger)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loadingMore, onLoadMore])

  return (
    <div
      ref={scrollContainerRef}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-[600px] overflow-y-auto"
    >
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No logs found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? (
              'Try adjusting your search or filters'
            ) : connecting ? (
              'Connecting to log stream...'
            ) : (
              'Logs will appear here as they are generated'
            )}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              isExpanded={expandedLogId === log.id}
              onToggle={() => onToggleLogExpand(log.id)}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}

      {/* Load More Trigger (for auto-load on scroll) */}
      <div ref={loadMoreTriggerRef} className="h-4" />

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="py-6 flex items-center justify-center">
          <Loader2 className="w- spin-icon" />
          <span className="ml-2 text-sm text-slate-600">Loading more logs...</span>
        </div>
      )}

      {/* End of Logs Message */}
      {!hasMore && filteredLogs.length > 0 && (
        <div className="py-6 text-center text-sm text-slate-500">All logs loaded</div>
      )}
    </div>
  )
}
