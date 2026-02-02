/**
 * Status Page - Module - Status Data Hook
 */

import { useEffect, useState, useCallback } from 'react'
import type { StatusResponse } from '../types'

export function useStatusData() {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      setStatusData(data)
      setError(null)
    } catch (err) {
      setError('Failed to load status information')
      console.error(err)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [])

  useEffect(() => {
    fetchStatus()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  return {
    statusData,
    loading,
    error,
    lastRefresh,
    fetchStatus,
  }
}
