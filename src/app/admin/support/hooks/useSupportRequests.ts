/**
 * Support Requests Hook
 * Manages support requests fetching and filtering
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { SupportRequest, SupportRequestsResponse, Status } from '../types'
import { PAGE_SIZE } from '../constants'

export function useSupportRequests() {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<Status>('all')
  const [page, setPage] = useState(0)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const res = await fetch(`/api/admin/support/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch support requests')
      }

      const data: SupportRequestsResponse = await res.json()
      setRequests(data.requests)
      setTotal(data.total)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Failed to fetch support requests')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, page])

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0)
  }, [selectedStatus])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return {
    requests,
    total,
    loading,
    error,
    selectedStatus,
    setSelectedStatus,
    page,
    setPage,
    totalPages,
    fetchRequests,
  }
}
