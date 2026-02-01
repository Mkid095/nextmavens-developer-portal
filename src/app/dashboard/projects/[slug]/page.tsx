'use client'

import { useState, useCallback, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import CodeBlockEnhancer from '@/components/docs/CodeBlockEnhancer'
import SupportRequestModal from '@/components/SupportRequestModal'
import SupportRequestDetailModal from '@/components/SupportRequestDetailModal'
import { usePermission } from '@/hooks/usePermissions'
import { Permission } from '@/lib/types/rbac.types'
import { useLanguageSelector } from '@/components/LanguageSelector'
import type { CodeLanguage } from '@/components/LanguageSelector'

// Types
import type {
  Project,
  Tab,
  NewKeyResponse,
  KeyType,
  McpAccessLevel,
  ServiceEndpoints,
} from './types'
import { getServiceEndpoints } from './types'

// Hooks
import {
  useProjectData,
  useApiKeys,
  useSuspensionStatus,
  useKeyUsageStats,
  useFeatureFlags,
  useSupportRequests,
  useServiceStatus,
  useCopyToClipboard,
  isKeyInactive,
  formatLastUsed,
} from './hooks'

// Components
import { ProjectHeader } from './components/ProjectHeader'
import { TabNavigation } from './components/TabNavigation'
import { ProjectBanners } from './components/Banners'
import { OverviewTab } from './components/OverviewTab'
import { DatabaseTab } from './components/DatabaseTab'
import { ApiKeysTab } from './components/ApiKeysTab'
import { AuthTab, StorageTab, GraphqlTab, RealtimeTab } from './components/ServiceTabs'
import { SupportTab } from './components/SupportTab'
import { FeatureFlagsTab } from './components/FeatureFlagsTab'
import { SecretsTab } from './components/SecretsTab'
import { McpAnalyticsTab } from './components/McpAnalyticsTab'

// Modals
import { RotateKeyModal } from './components/modals/RotateKeyModal'
import { RevokeKeyModal } from './components/modals/RevokeKeyModal'
import { DeleteProjectModal } from './components/modals/DeleteProjectModal'
import { UsageExamplesModal } from './components/modals/UsageExamplesModal'
import { CreateApiKeyModal } from './components/modals/CreateApiKeyModal'

type ServiceType = 'database' | 'auth' | 'storage' | 'realtime' | 'graphql'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('overview')

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

  // Refresh support requests when filter changes
  const handleSetSupportStatusFilter = useCallback((status: string) => {
    setSupportStatusFilter(status)
  }, [])

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

  // Tab content handlers
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

  const endpoints = getServiceEndpoints()

  // Loading state
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading project...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (!project) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Project not found</p>
          {projectError && <p className="text-sm text-red-600 mb-4">{projectError}</p>}
          <a href="/dashboard" className="text-emerald-700 hover:text-emerald-800">
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <CodeBlockEnhancer />
      <div className="min-h-screen bg-[#F3F5F7]">
        {/* Header */}
        <ProjectHeader project={project} onOpenSupport={() => setShowSupportModal(true)} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Banners */}
          <ProjectBanners
            project={project}
            suspensionStatus={suspensionStatus}
            onRequestSuspensionReview={() => {
              window.location.href = 'mailto:support@nextmavens.cloud?subject=Project Suspension Review Request'
            }}
          />

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            serviceStatuses={serviceStatuses}
            onToggleService={handleToggleService}
            updatingService={updatingService}
            canManageServices={canManageServices}
          />

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            {activeTab === 'overview' && (
              <OverviewTab
                project={project}
                canDeleteProject={canDeleteProject}
                onDeleteProject={() => setShowDeleteModal(true)}
              />
            )}

            {activeTab === 'database' && (
              <DatabaseTab
                project={project}
                codeLanguage={codeLanguage}
                onCodeLanguageChange={setCodeLanguage}
                serviceStatus={serviceStatuses.database}
                onToggleService={handleToggleService}
                updatingService={updatingService}
                canManageServices={canManageServices}
                onCopy={handleCopy}
                copied={copied}
                endpoints={endpoints}
              />
            )}

            {activeTab === 'auth' && (
              <AuthTab
                project={project}
                codeLanguage={codeLanguage}
                onCodeLanguageChange={setCodeLanguage}
                serviceStatus={serviceStatuses.auth}
                onToggleService={handleToggleService}
                updatingService={updatingService}
                canManageServices={canManageServices}
                endpoints={endpoints}
              />
            )}

            {activeTab === 'storage' && (
              <StorageTab
                project={project}
                codeLanguage={codeLanguage}
                onCodeLanguageChange={setCodeLanguage}
                serviceStatus={serviceStatuses.storage}
                onToggleService={handleToggleService}
                updatingService={updatingService}
                canManageServices={canManageServices}
                endpoints={endpoints}
              />
            )}

            {activeTab === 'realtime' && (
              <RealtimeTab
                project={project}
                codeLanguage={codeLanguage}
                onCodeLanguageChange={setCodeLanguage}
                serviceStatus={serviceStatuses.realtime}
                onToggleService={handleToggleService}
                updatingService={updatingService}
                canManageServices={canManageServices}
                endpoints={endpoints}
              />
            )}

            {activeTab === 'graphql' && (
              <GraphqlTab
                project={project}
                codeLanguage={codeLanguage}
                onCodeLanguageChange={setCodeLanguage}
                serviceStatus={serviceStatuses.graphql}
                onToggleService={handleToggleService}
                updatingService={updatingService}
                canManageServices={canManageServices}
                endpoints={endpoints}
              />
            )}

            {activeTab === 'api-keys' && (
              <ApiKeysTab
                project={project}
                apiKeys={apiKeys}
                newKey={newKey}
                keyUsageStats={keyUsageStats}
                usageStatsLoading={usageStatsLoading}
                copied={copied}
                canManageKeys={canManageKeys}
                onCopy={handleCopy}
                onCreateKey={openCreateKeyModal}
                onOpenRotate={openRotateModal}
                onOpenRevoke={openRevokeModal}
                onDeleteKey={handleDeleteApiKey}
                onToggleShowSecret={(keyId) => setShowSecret((prev) => ({ ...prev, [keyId]: !prev[keyId] }))}
                showSecret={showSecret}
                onCloseNewKey={() => setNewKey(null)}
                onOpenUsageExamples={() => setShowUsageExamples(true)}
              />
            )}

            {activeTab === 'secrets' && <SecretsTab projectId={project.id} />}

            {activeTab === 'mcp-analytics' && <McpAnalyticsTab projectId={project.id} />}

            {activeTab === 'feature-flags' && (
              <FeatureFlagsTab
                projectId={project.id}
                featureFlags={featureFlags}
                flagsLoading={flagsLoading}
                flagsError={flagsError}
                updatingFlag={null}
                onToggleFlag={onToggleFlag}
                onRemoveFlag={onRemoveFlag}
              />
            )}

            {activeTab === 'support' && (
              <SupportTab
                projectId={project.id}
                supportRequests={supportRequests}
                supportRequestsLoading={supportRequestsLoading}
                supportRequestsError={supportRequestsError}
                supportStatusFilter={supportStatusFilter}
                onSetSupportStatusFilter={handleSetSupportStatusFilter}
                onOpenCreateModal={() => setShowSupportModal(true)}
                onViewRequestDetails={handleViewRequestDetails}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <CreateApiKeyModal
        isOpen={showCreateKeyModal}
        isSubmitting={keySubmitting}
        keyError={keyError}
        onClose={() => setShowCreateKeyModal(false)}
        onSubmit={handleCreateApiKey}
      />

      {newKey && (
        <UsageExamplesModal
          isOpen={showUsageExamples}
          newKey={newKey}
          endpoints={endpoints}
          projectId={project.id}
          copied={copied}
          onClose={() => setShowUsageExamples(false)}
          onCopy={handleCopy}
        />
      )}

      <RotateKeyModal
        isOpen={showRotateModal}
        isSubmitting={rotateSubmitting}
        onClose={() => {
          setShowRotateModal(false)
          setSelectedKeyId(null)
        }}
        onConfirm={handleRotateKey}
      />

      <RevokeKeyModal
        isOpen={showRevokeModal}
        isSubmitting={revokeSubmitting}
        onClose={() => {
          setShowRevokeModal(false)
          setSelectedKeyId(null)
        }}
        onConfirm={handleRevokeKey}
      />

      {canDeleteProject && project && (
        <DeleteProjectModal
          isOpen={showDeleteModal}
          isSubmitting={deleteSubmitting}
          project={project}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteProject}
        />
      )}

      {project && (
        <SupportRequestModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          projectId={project.id}
          projectName={project.name}
        />
      )}

      {selectedRequestId && (
        <SupportRequestDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          requestId={selectedRequestId}
        />
      )}
    </>
  )
}
