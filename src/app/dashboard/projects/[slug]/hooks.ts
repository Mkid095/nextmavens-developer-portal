import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project, ApiKey, SuspensionRecord, KeyUsageStats } from './types'
import type { SuspensionStatusResponse } from './types'
import type { ServiceType, ServiceStatus } from '@/lib/types/service-status.types'

// ============================================================================
// Project Data Hooks
// ============================================================================

export interface UseProjectDataResult {
  project: Project | null
  loading: boolean
  error: string | null
  fetchProject: () => Promise<void>
}

export function useProjectData(slug: string | undefined): UseProjectDataResult {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!slug) return

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/by-slug?slug=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || 'Failed to load project')
        return
      }
      const data = await res.json()
      setProject(data.project)
    } catch (err) {
      console.error('Failed to fetch project:', err)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [slug, router])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return { project, loading, error, fetchProject }
}

// ============================================================================
// API Keys Hooks
// ============================================================================

export function useApiKeys(): {
  apiKeys: ApiKey[]
  loading: boolean
  fetchApiKeys: () => Promise<void>
} {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApiKeys = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApiKeys()
  }, [fetchApiKeys])

  return { apiKeys, loading, fetchApiKeys }
}

// ============================================================================
// Suspension Status Hooks
// ============================================================================

export function useSuspensionStatus(project: Project | null): {
  suspension: SuspensionRecord | null
  loading: boolean
  fetchSuspensionStatus: () => Promise<void>
} {
  const [suspension, setSuspension] = useState<SuspensionRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSuspensionStatus = useCallback(async () => {
    if (!project) return

    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project.id}/suspensions`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data: SuspensionStatusResponse = await res.json()
        if (data.suspended && data.suspension) {
          setSuspension(data.suspension)
        } else {
          setSuspension(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch suspension status:', err)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (project) {
      fetchSuspensionStatus()
    }
  }, [project, fetchSuspensionStatus])

  return { suspension, loading, fetchSuspensionStatus }
}

// ============================================================================
// Key Usage Stats Hooks (US-006)
// ============================================================================

export function useKeyUsageStats(apiKeys: ApiKey[]): {
  usageStats: Record<string, KeyUsageStats>
  loading: Record<string, boolean>
  fetchKeyUsageStats: (keyId: string) => Promise<void>
} {
  const [usageStats, setUsageStats] = useState<Record<string, KeyUsageStats>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const fetchKeyUsageStats = useCallback(async (keyId: string) => {
    setLoading((prev) => ({ ...prev, [keyId]: true }))
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/keys/${keyId}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: KeyUsageStats = await res.json()
        setUsageStats((prev) => ({ ...prev, [keyId]: data }))
      }
    } catch (err) {
      console.error(`Failed to fetch usage stats for key ${keyId}:`, err)
    } finally {
      setLoading((prev) => ({ ...prev, [keyId]: false }))
    }
  }, [])

  useEffect(() => {
    if (apiKeys.length > 0) {
      apiKeys.forEach((key) => {
        fetchKeyUsageStats(key.id)
      })
    }
  }, [apiKeys, fetchKeyUsageStats])

  return { usageStats, loading, fetchKeyUsageStats }
}

// ============================================================================
// Feature Flags Hooks (US-011)
// ============================================================================

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

// ============================================================================
// Support Requests Hooks (US-006)
// ============================================================================

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

// ============================================================================
// Service Status Hooks
// ============================================================================

export function useServiceStatus(): {
  serviceStatuses: Record<string, ServiceStatus>
  updatingService: ServiceType | null
  handleToggleService: (service: ServiceType, newStatus: ServiceStatus) => Promise<void>
} {
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, ServiceStatus>>({
    database: 'enabled',
    auth: 'enabled',
    storage: 'enabled',
    realtime: 'enabled',
    graphql: 'enabled',
  })
  const [updatingService, setUpdatingService] = useState<ServiceType | null>(null)

  const handleToggleService = useCallback(async (service: ServiceType, newStatus: ServiceStatus) => {
    if (updatingService) return

    // Confirm before disabling
    if (newStatus === 'disabled') {
      const confirmed = confirm(`Are you sure you want to disable the ${service} service? This may affect your application.`)
      if (!confirmed) return
    }

    setUpdatingService(service)
    try {
      // Simulate provisioning state when enabling
      if (newStatus === 'enabled') {
        setServiceStatuses((prev) => ({
          ...prev,
          [service]: 'provisioning',
        }))

        // Simulate provisioning delay (2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      setServiceStatuses((prev) => ({
        ...prev,
        [service]: newStatus,
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to ${newStatus === 'enabled' ? 'enable' : 'disable'} ${service} service`
      console.error(`Failed to toggle ${service} service:`, err)
      alert(message)
    } finally {
      setUpdatingService(null)
    }
  }, [updatingService])

  return { serviceStatuses, updatingService, handleToggleService }
}

// ============================================================================
// Utility Hooks
// ============================================================================

export function useCopyToClipboard(): {
  copied: string | null
  copy: (text: string, id: string) => void
} {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return { copied, copy }
}

export function isKeyInactive(key: ApiKey): boolean {
  if (!key.last_used) return false
  const lastUsed = new Date(key.last_used)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return lastUsed < thirtyDaysAgo
}

export function formatLastUsed(lastUsed: string | null | undefined): string {
  if (!lastUsed) return 'Never'
  const date = new Date(lastUsed)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}
