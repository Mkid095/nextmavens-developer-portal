/**
 * Usage Data Hook
 * Custom hook for fetching usage and project data
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { UsageResponse, Project, AggregationType } from '../types'

export function useUsageData() {
  const params = useParams()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [usageData, setUsageData] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [aggregation, setAggregation] = useState<AggregationType>('day')
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchProject()
    fetchUsageData()
  }, [params.slug, aggregation, days])

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/by-slug?slug=${params.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        throw new Error('Failed to load project')
      }
      const data = await res.json()
      setProject(data.project)
    } catch (err) {
      console.error('Failed to fetch project:', err)
      setError('Failed to load project')
    }
  }

  const fetchUsageData = async () => {
    if (!params.slug) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(
        `/api/usage/${params.slug}?aggregation=${aggregation}&days=${days}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        throw new Error('Failed to load usage data')
      }

      const data: UsageResponse = await res.json()
      setUsageData(data)
    } catch (err) {
      console.error('Failed to fetch usage data:', err)
      setError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsageData()
    setRefreshing(false)
  }

  return {
    project,
    usageData,
    loading,
    error,
    refreshing,
    aggregation,
    setAggregation,
    days,
    setDays,
    handleRefresh,
    retry: fetchUsageData,
  }
}
