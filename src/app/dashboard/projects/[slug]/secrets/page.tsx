'use client'

/**
 * Secrets Management Page
 * PRD: US-010 from prd-secrets-versioning.json
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import CreateSecretModal from '@/components/CreateSecretModal'
import DeleteSecretModal from '@/components/DeleteSecretModal'
import SecretRotateModal from '@/components/SecretRotateModal'
import SecretDetailsModal from '@/components/SecretDetailsModal'
import SecretVersionHistoryModal from '@/components/SecretVersionHistoryModal'
import type { Secret } from '@/lib/types/secrets.types'
import { useSecretsPage } from './hooks'
import type { Project } from './types'
import { filterSecrets } from './utils'
import { PageHeader, ErrorState, LoadingState, SecretFilters, EmptyState, Toast, SecretCard } from './components'

export default function SecretsPage() {
  const params = useParams()
  const slug = params.slug as string

  const [project, setProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRotateModal, setShowRotateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const {
    secrets,
    loading,
    error,
    setError,
    fetchSecrets,
    handleCreateSecret,
    handleDeleteSecret,
    handleRotateSecret,
    handleFetchSecretDetails,
    handleFetchVersions,
  } = useSecretsPage(project?.id)

  useEffect(() => {
    fetchProject()
  }, [slug])

  useEffect(() => {
    if (project?.id) {
      fetchSecrets()
    }
  }, [project])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/projects/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch project')
      const data = await response.json()
      setProject(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreateSecretWithToast = async (data: any) => {
    try {
      await handleCreateSecret(data)
      showToast('Secret created successfully')
    } catch (err: any) {
      throw err
    }
  }

  const handleDeleteSecretWithToast = async () => {
    if (!selectedSecret) return
    try {
      await handleDeleteSecret(selectedSecret.id)
      showToast('Secret deleted successfully')
    } catch (err: any) {
      throw err
    }
  }

  const handleRotateSecretWithToast = async (data: any) => {
    if (!selectedSecret) return
    try {
      await handleRotateSecret(selectedSecret.id, data)
      showToast('Secret rotated successfully')
    } catch (err: any) {
      throw err
    }
  }

  const filteredSecrets = filterSecrets(secrets, searchQuery, filterActive)

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <PageHeader
        projectSlug={slug}
        projectName={project?.name}
        onCreateSecret={() => setShowCreateModal(true)}
      />

      {error && <ErrorState error={error} />}

      <SecretFilters
        searchQuery={searchQuery}
        filterActive={filterActive}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterActive}
      />

      {loading ? (
        <LoadingState />
      ) : filteredSecrets.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          filterActive={filterActive}
          onCreateSecret={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid gap-4">
          {filteredSecrets.map((secret) => (
            <SecretCard
              key={secret.id}
              secret={secret}
              onViewDetails={(s) => {
                setSelectedSecret(s)
                setShowDetailsModal(true)
              }}
              onViewHistory={(s) => {
                setSelectedSecret(s)
                setShowVersionHistoryModal(true)
              }}
              onRotate={(s) => {
                setSelectedSecret(s)
                setShowRotateModal(true)
              }}
              onDelete={(s) => {
                setSelectedSecret(s)
                setShowDeleteModal(true)
              }}
            />
          ))}
        </div>
      )}

      <CreateSecretModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSecretWithToast}
        projectId={project?.id || ''}
      />

      {selectedSecret && (
        <>
          <DeleteSecretModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedSecret(null)
            }}
            onConfirm={handleDeleteSecretWithToast}
            secret={selectedSecret}
          />

          <SecretRotateModal
            isOpen={showRotateModal}
            onClose={() => {
              setShowRotateModal(false)
              setSelectedSecret(null)
            }}
            onRotate={handleRotateSecretWithToast}
            secret={selectedSecret}
          />

          <SecretDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedSecret(null)
            }}
            secret={selectedSecret}
            onFetchDetails={handleFetchSecretDetails}
          />

          <SecretVersionHistoryModal
            isOpen={showVersionHistoryModal}
            onClose={() => {
              setShowVersionHistoryModal(false)
              setSelectedSecret(null)
            }}
            secret={selectedSecret}
            onFetchVersions={handleFetchVersions}
            onViewVersion={(versionId) => {
              // Handle version view
            }}
          />
        </>
      )}
    </div>
  )
}
