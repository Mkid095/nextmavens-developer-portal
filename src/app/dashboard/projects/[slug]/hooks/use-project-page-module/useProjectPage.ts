/**
 * Project Page Hook - Module - Main Hook
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/usePermissions'
import { Permission } from '@/lib/types/rbac.types'
import { useLanguageSelector } from '@/components/LanguageSelector'
import type { KeyType, McpAccessLevel } from '../../types'
import {
  useProjectData,
  useApiKeys,
  useSuspensionStatus,
  useKeyUsageStats,
  useFeatureFlags,
  useSupportRequests,
  useServiceStatus,
  useCopyToClipboard,
} from '../.'
import { useModalStates } from './useModalStates'
import { useModalHandlers } from './modal-handlers'
import type { CreateApiKeyData } from './types'
import { API_ENDPOINTS } from './constants'

export function useProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { codeLanguage, setCodeLanguage } = useLanguageSelector()

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys' | 'secrets' | 'mcp-analytics' | 'feature-flags' | 'support'>('overview')

  // Modal states
  const modalStates = useModalStates()

  // Data fetching hooks
  const { project, loading: projectLoading, error: projectError } = useProjectData(params.slug as string)
  const { apiKeys, fetchApiKeys } = useApiKeys()
  const { suspension: suspensionStatus } = useSuspensionStatus(project)
  const { usageStats: keyUsageStats, loading: usageStatsLoading, fetchKeyUsageStats } = useKeyUsageStats(apiKeys)
  const { flags: featureFlags, loading: flagsLoading, error: flagsError, fetchFeatureFlags, onToggleFlag, onRemoveFlag } = useFeatureFlags(project?.id, activeTab === 'feature-flags')
  const { requests: supportRequests, loading: supportRequestsLoading, error: supportRequestsError, fetchSupportRequests } = useSupportRequests(project?.id, activeTab === 'support' ? 'all' : 'all')
  const { serviceStatuses, updatingService, handleToggleService } = useServiceStatus()
  const { copied, copy: handleCopy } = useCopyToClipboard()

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

  // Modal handlers
  const {
    openCreateKeyModal,
    openRotateModal,
    openRevokeModal,
    handleCreateApiKey,
    handleRotateKey,
    handleRevokeKey,
    handleViewRequestDetails,
  } = useModalHandlers({ ...modalStates, fetchApiKeys })

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) {
      return
    }

    await fetch(API_ENDPOINTS.DELETE_KEY(keyId), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }).then(() => fetchApiKeys())
  }

  const handleDeleteProject = async () => {
    modalStates.setDeleteSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(API_ENDPOINTS.DELETE_PROJECT(project?.id), {
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
      modalStates.setDeleteSubmitting(false)
    }
  }

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
    newKey: modalStates.newKey,
    showSecret: modalStates.showSecret,
    supportStatusFilter: modalStates.supportStatusFilter,

    // Permissions
    canDeleteProject,
    canManageServices,
    canManageKeys,

    // Modal states
    showCreateKeyModal: modalStates.showCreateKeyModal,
    setShowCreateKeyModal: modalStates.setShowCreateKeyModal,
    keySubmitting: modalStates.keySubmitting,
    keyError: modalStates.keyError,
    showRotateModal: modalStates.showRotateModal,
    setShowRotateModal: modalStates.setShowRotateModal,
    rotateSubmitting: modalStates.rotateSubmitting,
    showRevokeModal: modalStates.showRevokeModal,
    setShowRevokeModal: modalStates.setShowRevokeModal,
    revokeSubmitting: modalStates.revokeSubmitting,
    selectedKeyId: modalStates.selectedKeyId,
    setNewKey: modalStates.setNewKey,
    showUsageExamples: modalStates.showUsageExamples,
    setShowUsageExamples: modalStates.setShowUsageExamples,
    showDeleteModal: modalStates.showDeleteModal,
    setShowDeleteModal: modalStates.setShowDeleteModal,
    deleteSubmitting: modalStates.deleteSubmitting,
    showSupportModal: modalStates.showSupportModal,
    setShowSupportModal: modalStates.setShowSupportModal,
    selectedRequestId: modalStates.selectedRequestId,
    showDetailModal: modalStates.showDetailModal,
    setShowDetailModal: modalStates.setShowDetailModal,

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
