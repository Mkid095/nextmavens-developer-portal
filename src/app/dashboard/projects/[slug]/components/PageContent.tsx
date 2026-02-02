/**
 * Page Content Component
 * Main tab content area for the project detail page
 */

'use client'

import { motion } from 'framer-motion'
import type { Tab, ServiceEndpoints } from '../types'
import { OverviewTab } from './OverviewTab'
import { DatabaseTab } from './DatabaseTab'
import { ApiKeysTab } from './ApiKeysTab'
import { AuthTab, StorageTab, GraphqlTab, RealtimeTab } from './ServiceTabs'
import { SupportTab } from './SupportTab'
import { FeatureFlagsTab } from './FeatureFlagsTab'
import { SecretsTab } from './SecretsTab'
import { McpAnalyticsTab } from './McpAnalyticsTab'

interface PageContentProps {
  activeTab: Tab
  project: any
  codeLanguage: string
  setCodeLanguage: (lang: string) => void
  serviceStatuses: any
  updatingService: string | null
  handleToggleService: (service: string) => Promise<void>
  canDeleteProject: boolean
  canManageServices: boolean
  canManageKeys: boolean
  apiKeys: any[]
  newKey: any
  keyUsageStats: any
  usageStatsLoading: boolean
  copied: string | null
  handleCopy: (text: string) => void
  openCreateKeyModal: () => void
  openRotateModal: (keyId: string) => void
  openRevokeModal: (keyId: string) => void
  handleDeleteApiKey: (keyId: string) => Promise<void>
  showSecret: Record<string, boolean>
  setShowSecret: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void
  setNewKey: (value: any) => void
  setShowUsageExamples: (value: boolean) => void
  supportRequests: any[]
  supportRequestsLoading: boolean
  supportRequestsError: string | undefined
  supportStatusFilter: string
  setSupportStatusFilter: (value: string) => void
  handleViewRequestDetails: (requestId: string) => void
  featureFlags: any
  flagsLoading: boolean
  flagsError: string | undefined
  onToggleFlag: (flagId: string) => Promise<void>
  onRemoveFlag: (flagId: string) => Promise<void>
  endpoints: ServiceEndpoints
}

export function PageContent(props: PageContentProps) {
  const {
    activeTab,
    project,
    codeLanguage,
    setCodeLanguage,
    serviceStatuses,
    updatingService,
    handleToggleService,
    canDeleteProject,
    canManageServices,
    canManageKeys,
    apiKeys,
    newKey,
    keyUsageStats,
    usageStatsLoading,
    copied,
    handleCopy,
    openCreateKeyModal,
    openRotateModal,
    openRevokeModal,
    handleDeleteApiKey,
    showSecret,
    setShowSecret,
    setNewKey,
    setShowUsageExamples,
    supportRequests,
    supportRequestsLoading,
    supportRequestsError,
    supportStatusFilter,
    setSupportStatusFilter,
    handleViewRequestDetails,
    featureFlags,
    flagsLoading,
    flagsError,
    onToggleFlag,
    onRemoveFlag,
    endpoints,
  } = props

  return (
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
          onDeleteProject={() => {}}
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
          onSetSupportStatusFilter={setSupportStatusFilter}
          onOpenCreateModal={() => {}}
          onViewRequestDetails={handleViewRequestDetails}
        />
      )}
    </motion.div>
  )
}
