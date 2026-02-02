/**
 * Trace Search Hook
 * Handles searching for request traces by ID
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RequestTrace, TraceDetail } from '../types'

export function useTraceSearch() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trace, setTrace] = useState<RequestTrace | null>(null)

  const searchTrace = async (requestId: string): Promise<boolean> => {
    if (!requestId.trim()) return false

    setLoading(true)
    setError(null)
    setTrace(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/traces/${requestId.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        router.push('/login')
        return false
      }

      const data: TraceDetail = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Failed to fetch trace')
        return false
      }

      if (data.data) {
        setTrace(data.data)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to fetch trace:', err)
      setError('Failed to fetch trace. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const clearTrace = () => {
    setTrace(null)
    setError(null)
  }

  return {
    loading,
    error,
    trace,
    searchTrace,
    clearTrace,
  }
}
