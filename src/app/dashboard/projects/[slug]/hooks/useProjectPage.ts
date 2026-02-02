/**
 * Project Page Hook
 * Combines all data fetching and modal state management for the project detail page
 */

'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/usePermissions'
import { Permission } from '@/lib/types/rbac.types'
import { useLanguageSelector } from '@/components/LanguageSelector'
import type { KeyType, McpAccessLevel, NewKeyResponse } from '../types'
import {
  useProjectData,
  useApiKeys,
  useSuspensionStatus,
  useKeyUsageStats,
  useFeatureFlags,
  useSupportRequests,
  useServiceStatus,
  useCopyToClipboard,
} from './'

export function useProjectPage() {
  const params = useParams()
  const router = useRouter()

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys' | 'secrets' | 'mcp-analytics' | 'feature-flags' | 'support'>('overview')

  // Language selector
  const [codeLanguage, setCodeLanguage] = useLanguageSelector()

  // Data fetching hooks
  const { project, loading: projectLoading, error: projectError } = useProjectData(params.slug as string)
  const { apiKeys, fetchApiKeys } = useApiKeys()
  const { suspension: suspensionStatus } = useSuspensionStatus(project)
  const { usageStats: keyUsageStats, loading: usageStatsLoading, fetchKeyUsageStats } = useKeyUsageStats(apiKeys)
  const { flags: featureFlags, loading: flagsLoading, error: flagsError, fetchFeatureFlags, onToggleFlag, onRemoveFlag } = useFeatureFlags(project?.id, activeTab === 'feature-flags')
  const { requests: supportRequests, loading: supportRequestsLoading, error: supportRequestsError, fetchSupportRequests } = useSupportRequests(project?.id, activeTab === 'support' ? 'all' : 'all')
  const { serviceStatuses, updatingService, handleToggleService } = useServiceStatus()
  const { copied, copy: handleCopy } = useCopyToClipboard()

  // Modal states
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false)
  const [keySubmitting, setKeySubmitting] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [showRotateModal, setShowRotateModal] = useState(false)
  const [rotateSubmitting, setRotateSubmitting] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [revokeSubmitting, setRevokeSubmitting] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null)
  const [showUsageExamples, setShowUsageExamples] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [supportStatusFilter, setSupportStatusFilter] = useState('all')
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})

  // Permission hooks
  const { canPerform: canDeleteProject } = usePermission(
    Permission.PROJECTS_DELETE,
    project?.tenant_id || null,
    { enabled: !!project?.tenant_id }
  )
  const { canPerform: canManageServices } = usePermission(
    Permission.PROJECTS_MANAGE_SERVICES,
    project?.tenant_id || null,
    { enabled: !!project?.tenant_id }
  )
  const { canPerform: canManageKeys } = usePermission(
    Permission.PROJECTS_MANAGE_KEYS,
    project?.tenant_id || null,
    { enabled: !!project?.tenant_id }
  )

  // API Key handlers
  const handleCreateApiKey = async (data: {
    name: string
    keyType: KeyType
    environment: 'live' | 'test' | 'dev'
    scopes: string[]
    mcpAccessLevel: McpAccessLevel
  }) => {
    setKeyError('')
    setKeySubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const requestBody = {
        name: data.name,
        key_type: data.keyType,
        environment: data.environment,
        scopes: data.scopes,
      }

      if (data.keyType === 'mcp') {
        Object.assign(requestBody, { mcp_access_level: data.mcpAccessLevel })
      }

      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create API key')
      }

      setNewKey(responseData)
      setShowUsageExamples(true)
      setShowCreateKeyModal(false)
      fetchApiKeys()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create API key'
      setKeyError(message)
    } finally {
      setKeySubmitting(false)
    }
  }

  const handleRotateKey = async () => {
    if (!selectedKeyId) return

    setRotateSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/keys/${selectedKeyId}/rotate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to rotate API key')
      }

      setNewKey({
        apiKey: data.newKey,
        secretKey: data.secretKey,
      })

      setShowRotateModal(false)
      fetchApiKeys()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to rotate API key'
      alert(message)
    } finally {
      setRotateSubmitting(false)
    }
  }

  const handleRevokeKey = async () => {
    if (!selectedKeyId) return

    setRevokeSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/keys/${selectedKeyId}/revoke`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to revoke API key')
      }

      setShowRevokeModal(false)
      fetchApiKeys()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke API key'
      alert(message)
    } finally {
      setRevokeSubmitting(false)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) {
      return
    }

    await fetch(`/api/api-keys?id=${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).then(() => fetchApiKeys())
  }

  const handleDeleteProject = async () => {
    setDeleteSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project?.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to delete project' }))
        throw new Error(data.error || 'Failed to delete project')
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project'
      console.error('Failed to delete project:', err)
      throw new Error(message)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Modal handlers
  const openCreateKeyModal = useCallback(() => {
    setShowCreateKeyModal(true)
    setKeyError('')
  }, [])

  const openRotateModal = useCallback((keyId: string) => {
    setSelectedKeyId(keyId)
    setShowRotateModal(true)
  }, [])

  const openRevokeModal = useCallback((keyId: string) => {
    setSelectedKeyId(keyId)
    setShowRevokeModal(true)
  }, [])

  const handleViewRequestDetails = useCallback((requestId: string) => {
    setSelectedRequestId(requestId)
    setShowDetailModal(true)
  }, [])

  return {
    // State
    activeTab,
    setActiveTab,
    codeLanguage,
    setCodeLanguage,
    project,
    projectLoading,
    projectError,
    apiKeys,
    suspensionStatus,
    keyUsageStats,
    usageStatsLoading,
    featureFlags,
    flagsLoading,
    flagsError,
    supportRequests,
    supportRequestsLoading,
    supportRequestsError,
    serviceStatuses,
    updatingService,
    copied,
    newKey,
    showSecret,
    supportStatusFilter,

    // Permissions
    canDeleteProject,
    canManageServices,
    canManageKeys,

    // Modal states
    showCreateKeyModal,
    setShowCreateKeyModal,
    keySubmitting,
    keyError,
    showRotateModal,
    setShowRotateModal,
    rotateSubmitting,
    showRevokeModal,
    setShowRevokeModal,
    revokeSubmitting,
    selectedKeyId,
    setNewKey,
    showUsageExamples,
    setShowUsageExamples,
    showDeleteModal,
    setShowDeleteModal,
    deleteSubmitting,
    showSupportModal,
    setShowSupportModal,
    selectedRequestId,
    showDetailModal,
    setShowDetailModal,

    // Handlers
    handleToggleService,
    handleCopy,
    handleCreateApiKey,
    handleRotateKey,
    handleRevokeKey,
    handleDeleteApiKey,
    handleDeleteProject,
    openCreateKeyModal,
    openRotateModal,
    openRevokeModal,
    handleViewRequestDetails,
    onToggleFlag,
    onRemoveFlag,
    setSupportStatusFilter,
    setShowSecret,
    fetchFeatureFlags,
    fetchSupportRequests,
  }
}
