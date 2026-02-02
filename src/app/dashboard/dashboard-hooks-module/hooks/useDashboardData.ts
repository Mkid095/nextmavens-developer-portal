/**
 * Dashboard Hooks - Module - Dashboard Data Hook
 */

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ApiKey, Project, Developer } from '../../utils'
import { fetchDeveloperData, fetchApiKeys, fetchProjects, fetchDeletedProjects } from '../utils/fetch-functions'

export function useDashboardData() {
  const router = useRouter()
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDeveloperData(router, setDeveloper, setLoading)
    fetchApiKeys(router, setApiKeys)
    fetchProjects(router, setProjects)
    fetchDeletedProjects(router, setDeletedProjects)
  }, [router])

  const refetchData = useCallback(() => {
    fetchApiKeys(router, setApiKeys)
    fetchProjects(router, setProjects)
    fetchDeletedProjects(router, setDeletedProjects)
  }, [router])

  return {
    developer,
    apiKeys,
    projects,
    deletedProjects,
    loading,
    refetchData,
  }
}
