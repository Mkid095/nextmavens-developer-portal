'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  AuditLogApiResponse,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogQueryParams,
} from '@/lib/types/audit.types'
import { ACTION_TYPES, TARGET_TYPES } from '@/lib/types/audit.types'

const AUDIT_API_URL = process.env.NEXT_PUBLIC_AUDIT_API_URL || 'http://localhost:8080/api/audit'
const RESULTS_PER_PAGE = 50

interface PaginationState {
  total: number
  limit: number
  offset: number
  has_more: boolean
}

/**
 * Validate ISO date string format
 */
function isValidISODate(dateString: string): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

export function useAuditLogs() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [developer, setDeveloper] = useState<{ id: string; name: string; email: string } | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    limit: RESULTS_PER_PAGE,
    offset: 0,
    has_more: false,
  })
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDeveloperData()
    fetchAuditLogs()
  }, [router])

  const fetchDeveloperData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/developer/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
        }
        return
      }

      const data = await res.json()
      setDeveloper(data.developer)
    } catch (err) {
      console.error('Failed to fetch developer:', err)
    }
  }

  const fetchAuditLogs = async (offsetParam: number = 0) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Validate and sanitize filter values
      const validActions = new Set<string>(ACTION_TYPES.map(t => t.value))
      const validTargetTypes = new Set<string>(TARGET_TYPES.map(t => t.value))

      const params: AuditLogQueryParams = {
        limit: RESULTS_PER_PAGE,
        offset: offsetParam,
      }

      // Only add validated filter values
      if (filters.action && validActions.has(filters.action)) {
        params.action = filters.action
      }
      if (filters.targetType && validTargetTypes.has(filters.targetType)) {
        params.target_type = filters.targetType
      }
      if (filters.startDate && isValidISODate(filters.startDate)) {
        params.start_date = filters.startDate
      }
      if (filters.endDate && isValidISODate(filters.endDate)) {
        params.end_date = filters.endDate
      }

      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = String(value)
          }
          return acc
        }, {} as Record<string, string>)
      ).toString()

      const res = await fetch(`${AUDIT_API_URL}?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
          throw new Error('Authentication expired')
        }
        throw new Error('Failed to fetch audit logs. Please try again later.')
      }

      const data: AuditLogApiResponse = await res.json()
      setLogs(data.data)
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        has_more: data.pagination.has_more,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs'
      setError(message)
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = useCallback(() => {
    fetchAuditLogs(0)
  }, [filters])

  const handleClearFilters = useCallback(() => {
    setFilters({
      action: '',
      targetType: '',
      startDate: '',
      endDate: '',
    })
    setTimeout(() => fetchAuditLogs(0), 0)
  }, [fetchAuditLogs])

  const handlePageChange = useCallback((newOffset: number) => {
    fetchAuditLogs(newOffset)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchAuditLogs])

  return {
    logs,
    loading,
    error,
    developer,
    pagination,
    filters,
    setFilters,
    fetchAuditLogs,
    handleApplyFilters,
    handleClearFilters,
    handlePageChange,
  }
}
