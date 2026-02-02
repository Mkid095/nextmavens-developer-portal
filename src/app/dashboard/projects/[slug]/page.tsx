'use client'

import CodeBlockEnhancer from '@/components/docs/CodeBlockEnhancer'
import { getServiceEndpoints } from './types'
import { useProjectPage } from './hooks/useProjectPage'
import { ProjectHeader } from './components/ProjectHeader'
import { TabNavigation } from './components/TabNavigation'
import { ProjectBanners } from './components/Banners'
import { PageContent } from './components/PageContent'
import { PageModals } from './components/PageModals'
import { LoadingState, ErrorState } from './components/PageStates'

type Tab = 'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys' | 'secrets' | 'mcp-analytics' | 'feature-flags' | 'support'

export default function ProjectDetailPage() {
  const {
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
    canDeleteProject,
    canManageServices,
    canManageKeys,
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
    setNewKey,
    fetchFeatureFlags,
    fetchSupportRequests,
  } = useProjectPage()

  const endpoints = getServiceEndpoints()

  // Loading state
  if (projectLoading) {
    return <LoadingState />
  }

  // Error state
  if (!project) {
    return <ErrorState projectError={projectError} />
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
          <PageContent
            activeTab={activeTab}
            project={project}
            codeLanguage={codeLanguage}
            setCodeLanguage={setCodeLanguage}
            serviceStatuses={serviceStatuses}
            updatingService={updatingService}
            handleToggleService={handleToggleService}
            canDeleteProject={canDeleteProject}
            canManageServices={canManageServices}
            canManageKeys={canManageKeys}
            apiKeys={apiKeys}
            newKey={newKey}
            keyUsageStats={keyUsageStats}
            usageStatsLoading={usageStatsLoading}
            copied={copied}
            handleCopy={handleCopy}
            openCreateKeyModal={openCreateKeyModal}
            openRotateModal={openRotateModal}
            openRevokeModal={openRevokeModal}
            handleDeleteApiKey={handleDeleteApiKey}
            showSecret={showSecret}
            setShowSecret={setShowSecret}
            setNewKey={setNewKey}
            setShowUsageExamples={setShowUsageExamples}
            supportRequests={supportRequests}
            supportRequestsLoading={supportRequestsLoading}
            supportRequestsError={supportRequestsError}
            supportStatusFilter={supportStatusFilter}
            setSupportStatusFilter={setSupportStatusFilter}
            handleViewRequestDetails={handleViewRequestDetails}
            featureFlags={featureFlags}
            flagsLoading={flagsLoading}
            flagsError={flagsError}
            onToggleFlag={onToggleFlag}
            onRemoveFlag={onRemoveFlag}
            endpoints={endpoints}
          />
        </div>
      </div>

      {/* Modals */}
      <PageModals
        project={project}
        showCreateKeyModal={showCreateKeyModal}
        setShowCreateKeyModal={setShowCreateKeyModal}
        keySubmitting={keySubmitting}
        keyError={keyError}
        handleCreateApiKey={handleCreateApiKey}
        newKey={newKey}
        showUsageExamples={showUsageExamples}
        setShowUsageExamples={setShowUsageExamples}
        copied={copied}
        handleCopy={handleCopy}
        showRotateModal={showRotateModal}
        setShowRotateModal={setShowRotateModal}
        rotateSubmitting={rotateSubmitting}
        handleRotateKey={handleRotateKey}
        selectedKeyId={selectedKeyId}
        showRevokeModal={showRevokeModal}
        setShowRevokeModal={setShowRevokeModal}
        revokeSubmitting={revokeSubmitting}
        handleRevokeKey={handleRevokeKey}
        canDeleteProject={canDeleteProject}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deleteSubmitting={deleteSubmitting}
        handleDeleteProject={handleDeleteProject}
        showSupportModal={showSupportModal}
        setShowSupportModal={setShowSupportModal}
        selectedRequestId={selectedRequestId}
        showDetailModal={showDetailModal}
        setShowDetailModal={setShowDetailModal}
      />
    </>
  )
}
