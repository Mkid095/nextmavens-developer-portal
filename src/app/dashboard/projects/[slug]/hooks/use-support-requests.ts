/**
 * Use Support Requests Hook (US-006)
 */

import { useEffect, useCallback, useState } from 'react'

export interface SupportRequest {
  id: string
  project_id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  resolved_at: string | null
}

export function useSupportRequests(projectId: string | undefined, statusFilter: string): {
  requests: SupportRequest[]
  loading: boolean
  error: string | null
  fetchSupportRequests: () => Promise<void>
} {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSupportRequests = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : ''
      const res = await fetch(`/api/support/requests?project_id=${projectId}${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to fetch support requests')
      }
    } catch (err) {
      console.error('Failed to fetch support requests:', err)
      setError('Failed to fetch support requests')
    } finally {
      setLoading(false)
    }
  }, [projectId, statusFilter])

  useEffect(() => {
    fetchSupportRequests()
  }, [fetchSupportRequests])

  return { requests, loading, error, fetchSupportRequests }
}
