/**
 * Hook for managing log pagination
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { LogEntry } from '../types'

const PAGE_SIZE = 100

export function useLogPagination(logs: LogEntry[]) {
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalLogCount, setTotalLogCount] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDisplayedLogs(logs.slice(0, PAGE_SIZE))
    setHasMore(logs.length > PAGE_SIZE)
    setTotalLogCount(logs.length)
  }, [logs])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setTimeout(() => {
      setDisplayedLogs((prev) => {
        const currentLength = prev.length
        const nextLogs = logs.slice(currentLength, currentLength + PAGE_SIZE)
        const combined = [...prev, ...nextLogs]
        setHasMore(logs.length > combined.length)
        return combined
      })
      setLoadingMore(false)
    }, 300)
  }, [loadingMore, hasMore, logs])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const trigger = loadMoreTriggerRef.current
    if (!scrollContainer || !trigger || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { root: scrollContainer, rootMargin: '200px', threshold: 0.1 }
    )

    observer.observe(trigger)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  return {
    displayedLogs,
    loadingMore,
    hasMore,
    totalLogCount,
    scrollContainerRef,
    loadMoreTriggerRef,
    loadMore,
  }
}
