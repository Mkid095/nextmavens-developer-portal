/**
 * Abuse Dashboard - Dashboard Data Hook
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DashboardData, TimeRange } from '../types'

interface UseDashboardDataResult {
  dashboardData: DashboardData | null
  loading: boolean
  refreshing: boolean
  error: string
  fetchDashboardData: () => Promise<void>
  handleRefresh: () => void
}

export function useDashboardData(timeRange: TimeRange): UseDashboardDataResult {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/admin/abuse/dashboard?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
        }
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      const result = await res.json()
      setDashboardData(result.data)
      setError('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDashboardData()
  }, [router, timeRange])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  return {
    dashboardData,
    loading,
    refreshing,
    error,
    fetchDashboardData,
    handleRefresh,
  }
}
