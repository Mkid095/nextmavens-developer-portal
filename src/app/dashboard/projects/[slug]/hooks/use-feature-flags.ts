/**
 * Use Feature Flags Hook (US-011)
 */

import { useEffect, useCallback, useState } from 'react'

export interface FeatureFlag {
  name: string
  enabled: boolean
  is_project_specific: boolean
  description?: string
}

export function useFeatureFlags(projectId: string | undefined, enabled: boolean): {
  flags: FeatureFlag[]
  loading: boolean
  error: string | null
  fetchFeatureFlags: () => Promise<void>
  onToggleFlag: (flagName: string, currentEnabled: boolean) => Promise<void>
  onRemoveFlag: (flagName: string) => Promise<void>
} {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatureFlags = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFlags(data.flags || [])
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to fetch feature flags')
      }
    } catch (err) {
      console.error('Failed to fetch feature flags:', err)
      setError('Failed to fetch feature flags')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const onToggleFlag = useCallback(async (flagName: string, currentEnabled: boolean) => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags/${flagName}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !currentEnabled,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update feature flag')
      }

      // Refresh feature flags
      await fetchFeatureFlags()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update feature flag'
      console.error('Failed to toggle feature flag:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [projectId, fetchFeatureFlags])

  const onRemoveFlag = useCallback(async (flagName: string) => {
    if (!projectId) return

    if (!confirm(`Remove project-specific setting for "${flagName}" and use the global default?`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags/${flagName}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove feature flag')
      }

      // Refresh feature flags
      await fetchFeatureFlags()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove feature flag'
      console.error('Failed to remove feature flag:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [projectId, fetchFeatureFlags])

  useEffect(() => {
    if (enabled) {
      fetchFeatureFlags()
    }
  }, [enabled, fetchFeatureFlags])

  return { flags, loading, error, fetchFeatureFlags, onToggleFlag, onRemoveFlag }
}
