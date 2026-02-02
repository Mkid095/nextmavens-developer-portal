/**
 * Hook for managing SSE log stream connection
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { LogEntry, ServiceFilter, LevelFilter, DateRangeFilter } from '../types'
import { getDateRange } from '../utils'

interface UseLogStreamOptions {
  projectId: string | undefined
  serviceFilter: ServiceFilter
  levelFilter: LevelFilter
  dateRangeFilter: DateRangeFilter
  customStartDate?: string
  customEndDate?: string
}

export function useLogStream({
  projectId,
  serviceFilter,
  levelFilter,
  dateRangeFilter,
  customStartDate,
  customEndDate,
}: UseLogStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connecting, setConnecting] = useState(false)

  const connectToLogStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setConnecting(true)
    setLogs([])

    if (!projectId) {
      setConnecting(false)
      return
    }

    const urlParams = new URLSearchParams()
    urlParams.append('project_id', projectId)

    if (serviceFilter !== 'all') {
      urlParams.append('service', serviceFilter)
    }

    if (levelFilter !== 'all') {
      urlParams.append('level', levelFilter)
    }

    const { startDate, endDate } = getDateRange(dateRangeFilter, customStartDate, customEndDate)
    if (startDate) urlParams.append('start_date', startDate)
    if (endDate) urlParams.append('end_date', endDate)

    const streamUrl = '/api/logs/stream?' + urlParams.toString()

    try {
      const eventSource = new EventSource(streamUrl)
      eventSourceRef.current = eventSource

      eventSource.addEventListener('connected', () => {
        setConnecting(false)
      })

      eventSource.addEventListener('log', (event) => {
        try {
          const logEntry: LogEntry = JSON.parse(event.data)
          setLogs((prev) => {
            if (prev.some((log) => log.id === logEntry.id)) {
              return prev
            }
            return [logEntry, ...prev]
          })
        } catch (err) {
          console.error('Failed to parse log entry:', err)
        }
      })

      eventSource.onerror = () => {
        console.error('EventSource error')
        setConnecting(false)
        eventSource.close()
      }
    } catch (err) {
      console.error('Failed to create EventSource:', err)
      setConnecting(false)
    }
  }, [projectId, serviceFilter, levelFilter, dateRangeFilter, customStartDate, customEndDate])

  useEffect(() => {
    if (!projectId) return
    connectToLogStream()
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [projectId])

  return { logs, connecting }
}
