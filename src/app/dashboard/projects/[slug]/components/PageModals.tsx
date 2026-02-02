/**
 * Page Modals Component
 * All modal components for the project detail page
 */

'use client'

import { RotateKeyModal } from './modals/RotateKeyModal'
import { RevokeKeyModal } from './modals/RevokeKeyModal'
import { DeleteProjectModal } from './modals/DeleteProjectModal'
import { UsageExamplesModal } from './modals/UsageExamplesModal'
import { CreateApiKeyModal } from './modals/CreateApiKeyModal'
import SupportRequestModal from '@/components/SupportRequestModal'
import SupportRequestDetailModal from '@/components/SupportRequestDetailModal'
import { getServiceEndpoints } from '../types'

interface PageModalsProps {
  project: any
  showCreateKeyModal: boolean
  setShowCreateKeyModal: (value: boolean) => void
  keySubmitting: boolean
  keyError: string
  handleCreateApiKey: (data: any) => Promise<void>
  newKey: any
  showUsageExamples: boolean
  setShowUsageExamples: (value: boolean) => void
  copied: string | null
  handleCopy: (text: string) => void
  showRotateModal: boolean
  setShowRotateModal: (value: boolean) => void
  rotateSubmitting: boolean
  handleRotateKey: () => Promise<void>
  selectedKeyId: string | null
  showRevokeModal: boolean
  setShowRevokeModal: (value: boolean) => void
  revokeSubmitting: boolean
  handleRevokeKey: () => Promise<void>
  canDeleteProject: boolean
  showDeleteModal: boolean
  setShowDeleteModal: (value: boolean) => void
  deleteSubmitting: boolean
  handleDeleteProject: () => Promise<void>
  showSupportModal: boolean
  setShowSupportModal: (value: boolean) => void
  selectedRequestId: string | null
  showDetailModal: boolean
  setShowDetailModal: (value: boolean) => void
}

export function PageModals(props: PageModalsProps) {
  const {
    project,
    showCreateKeyModal,
    setShowCreateKeyModal,
    keySubmitting,
    keyError,
    handleCreateApiKey,
    newKey,
    showUsageExamples,
    setShowUsageExamples,
    copied,
    handleCopy,
    showRotateModal,
    setShowRotateModal,
    rotateSubmitting,
    handleRotateKey,
    selectedKeyId,
    showRevokeModal,
    setShowRevokeModal,
    revokeSubmitting,
    handleRevokeKey,
    canDeleteProject,
    showDeleteModal,
    setShowDeleteModal,
    deleteSubmitting,
    handleDeleteProject,
    showSupportModal,
    setShowSupportModal,
    selectedRequestId,
    showDetailModal,
    setShowDetailModal,
  } = props

  const endpoints = getServiceEndpoints()

  return (
    <>
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
        }}
        onConfirm={handleRotateKey}
      />

      <RevokeKeyModal
        isOpen={showRevokeModal}
        isSubmitting={revokeSubmitting}
        onClose={() => {
          setShowRevokeModal(false)
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
