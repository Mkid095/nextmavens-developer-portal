/**
 * Feature Flags Hook
 * Handles feature flags CRUD operations
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { FeatureFlag, FlagsResponse } from '../types'

export function useFeatureFlags(projectSlug: string) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [fetching, setFetching] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchProjectInfo()
  }, [router, projectSlug])

  const fetchProjectInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/by-slug/${projectSlug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch project info')
      }

      const data = await res.json()
      if (data.success && data.project) {
        setProjectId(data.project.id)
        fetchFlags(data.project.id)
      }
    } catch (err: unknown) {
      console.error('Failed to fetch project info:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch project info'
      setError(message)
      setLoading(false)
    }
  }

  const fetchFlags = async (pid: string) => {
    setFetching(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${pid}/feature-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
          return
        }
        throw new Error(data.error || data.details || 'Failed to fetch feature flags')
      }

      setFlags(data.flags || [])
    } catch (err: unknown) {
      console.error('Failed to fetch feature flags:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch feature flags'
      setError(message)
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }

  const toggleFlag = async (flag: FeatureFlag): Promise<boolean> => {
    if (!projectId) return false

    setUpdating(flag.name)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags/${flag.name}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !flag.enabled,
        }),
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to update feature flag')
      }

      setFlags((prev) =>
        prev.map((f) => (f.name === flag.name ? { ...f, enabled: !flag.enabled } : f))
      )

      return true
    } catch (err: unknown) {
      console.error('Failed to update feature flag:', err)
      const message = err instanceof Error ? err.message : 'Failed to update feature flag'
      setError(message)
      return false
    } finally {
      setUpdating(null)
    }
  }

  const deleteFlag = async (flag: FeatureFlag): Promise<boolean> => {
    if (!projectId) return false

    // Only allow deleting project-specific flags
    if (flag.scope !== 'project') {
      return false
    }

    setDeleting(flag.name)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags/${flag.name}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to delete feature flag')
      }

      // Remove the flag from the list and fetch updated flags
      await fetchFlags(projectId)
      return true
    } catch (err: unknown) {
      console.error('Failed to delete feature flag:', err)
      const message = err instanceof Error ? err.message : 'Failed to delete feature flag'
      setError(message)
      return false
    } finally {
      setDeleting(null)
    }
  }

  const createFlag = async (name: string, enabled: boolean): Promise<boolean> => {
    if (!projectId) return false

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, enabled }),
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to create feature flag')
      }

      await fetchFlags(projectId)
      return true
    } catch (err: unknown) {
      console.error('Failed to create feature flag:', err)
      const message = err instanceof Error ? err.message : 'Failed to create feature flag'
      setError(message)
      return false
    }
  }

  const refreshFlags = () => {
    if (projectId) {
      fetchFlags(projectId)
    }
  }

  return {
    loading,
    flags,
    fetching,
    updating,
    deleting,
    error,
    projectId,
    projectFlags: flags.filter((f) => f.scope === 'project'),
    globalFlags: flags.filter((f) => f.scope === 'global'),
    toggleFlag,
    deleteFlag,
    createFlag,
    refreshFlags,
  }
}
