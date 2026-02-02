/**
 * useDashboardAuth Hook
 *
 * Authentication and data fetching logic for the dashboard.
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Developer, ApiKey, Project } from '../types'

export function useDashboardAuth() {
  const router = useRouter()

  const fetchWithAuth = useCallback(async (url: string) => {
    const token = localStorage.getItem('accessToken')
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) {
      localStorage.clear()
      router.push('/login')
      return null
    }

    return res
  }, [router])

  const fetchDeveloperData = useCallback(async (): Promise<Developer | null> => {
    try {
      const res = await fetchWithAuth('/api/developer/me')
      if (!res) return null

      const data = await res.json()
      return data.developer
    } catch (err) {
      console.error('Failed to fetch developer:', err)
      return null
    }
  }, [fetchWithAuth])

  const fetchApiKeys = useCallback(async (): Promise<ApiKey[]> => {
    try {
      const res = await fetchWithAuth('/api/api-keys')
      if (!res) return []

      const data = await res.json()
      return data.apiKeys || []
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
      return []
    }
  }, [fetchWithAuth])

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    try {
      const res = await fetchWithAuth('/api/projects')
      if (!res) return []

      const data = await res.json()
      return data.projects || []
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      return []
    }
  }, [fetchWithAuth])

  const fetchDeletedProjects = useCallback(async (): Promise<Project[]> => {
    try {
      const res = await fetchWithAuth('/api/projects?status=deleted')
      if (!res) return []

      const data = await res.json()
      return data.projects || []
    } catch (err) {
      console.error('Failed to fetch deleted projects:', err)
      return []
    }
  }, [fetchWithAuth])

  return {
    fetchDeveloperData,
    fetchApiKeys,
    fetchProjects,
    fetchDeletedProjects,
    fetchWithAuth,
  }
}
