/**
 * Dashboard Hooks - Module - Data Fetching Functions
 */

import type { Developer, ApiKey, Project } from '../../utils'

export async function fetchDeveloperData(
  router: any,
  setDeveloper: (developer: Developer | null) => void,
  setLoading: (loading: boolean) => void
) {
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
  } finally {
    setLoading(false)
  }
}

export async function fetchApiKeys(
  router: any,
  setApiKeys: (keys: ApiKey[]) => void
) {
  try {
    const token = localStorage.getItem('accessToken')
    const res = await fetch('/api/api-keys', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      const data = await res.json()
      setApiKeys(data.apiKeys || [])
    } else if (res.status === 401) {
      localStorage.clear()
      router.push('/login')
    }
  } catch (err) {
    console.error('Failed to fetch API keys:', err)
  }
}

export async function fetchProjects(
  router: any,
  setProjects: (projects: Project[]) => void
) {
  try {
    const token = localStorage.getItem('accessToken')
    const res = await fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      const data = await res.json()
      setProjects(data.projects || [])
    } else if (res.status === 401) {
      localStorage.clear()
      router.push('/login')
    }
  } catch (err) {
    console.error('Failed to fetch projects:', err)
  }
}

export async function fetchDeletedProjects(
  router: any,
  setDeletedProjects: (projects: Project[]) => void
) {
  try {
    const token = localStorage.getItem('accessToken')
    const res = await fetch('/api/projects?status=deleted', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      const data = await res.json()
      setDeletedProjects(data.projects || [])
    } else if (res.status === 401) {
      localStorage.clear()
      router.push('/login')
    }
  } catch (err) {
    console.error('Failed to fetch deleted projects:', err)
  }
}
