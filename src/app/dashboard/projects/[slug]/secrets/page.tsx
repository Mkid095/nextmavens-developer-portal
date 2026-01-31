'use client'

/**
 * Secrets Management Page
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Page for managing secrets - list, create, rotate, view, delete
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Key,
  Eye,
  History,
  RotateCw,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Calendar,
  Hash,
  Clock,
} from 'lucide-react'
import CreateSecretModal from '@/components/CreateSecretModal'
import DeleteSecretModal from '@/components/DeleteSecretModal'
import SecretRotateModal from '@/components/SecretRotateModal'
import SecretDetailsModal from '@/components/SecretDetailsModal'
import SecretVersionHistoryModal from '@/components/SecretVersionHistoryModal'
import { secretsApi } from '@/lib/api/secrets-client'
import type {
  Secret,
  SecretDetails,
  SecretVersion,
  CreateSecretRequest,
  RotateSecretRequest,
} from '@/lib/types/secrets.types'

interface Project {
  id: string
  name: string
  slug: string
}

export default function SecretsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [project, setProject] = useState<Project | null>(null)
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRotateModal, setShowRotateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fetch project and secrets on mount
  useEffect(() => {
    fetchProject()
    fetchSecrets()
  }, [slug])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/projects/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch project')
      const data = await response.json()
      setProject(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchSecrets = async () => {
    if (!project?.id) return

    setLoading(true)
    setError('')

    try {
      const response = await secretsApi.list(project.id)
      setSecrets(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch secrets')
    } finally {
      setLoading(false)
    }
  }

  // Update fetchSecrets to be called when project is loaded
  useEffect(() => {
    if (project?.id) {
      fetchSecrets()
    }
  }, [project])

  const handleCreateSecret = async (data: CreateSecretRequest) => {
    try {
      await secretsApi.create(data)
      await fetchSecrets()
      showToast('Secret created successfully')
    } catch (err: any) {
      throw err
    }
  }

  const handleDeleteSecret = async () => {
    if (!selectedSecret) return

    try {
      await secretsApi.delete(selectedSecret.id)
      await fetchSecrets()
      showToast('Secret deleted successfully')
    } catch (err: any) {
      throw err
    }
  }

  const handleRotateSecret = async (data: RotateSecretRequest) => {
    if (!selectedSecret) return

    try {
      await secretsApi.rotate(selectedSecret.id, data)
      await fetchSecrets()
      showToast('Secret rotated successfully')
    } catch (err: any) {
      throw err
    }
  }

  const handleFetchSecretDetails = async (id: string): Promise<SecretDetails> => {
    const response = await secretsApi.get(id)
    return response.data
  }

  const handleFetchVersions = async (id: string): Promise<SecretVersion[]> => {
    const response = await secretsApi.listVersions(id)
    return response.data
  }

  const openDeleteModal = (secret: Secret) => {
    setSelectedSecret(secret)
    setShowDeleteModal(true)
  }

  const openRotateModal = (secret: Secret) => {
    setSelectedSecret(secret)
    setShowRotateModal(true)
  }

  const openDetailsModal = (secret: Secret) => {
    setSelectedSecret(secret)
    setShowDetailsModal(true)
  }

  const openVersionHistoryModal = (secret: Secret) => {
    setSelectedSecret(secret)
    setShowVersionHistoryModal(true)
  }

  // Filter secrets based on search and active filter
  const filteredSecrets = secrets.filter((secret) => {
    const matchesSearch = secret.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterActive === null || secret.active === filterActive
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`

    return date.toLocaleDateString()
  }

  const formatGracePeriodEnd = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours <= 0) return 'Expired'
    if (diffHours < 1) return 'Less than 1 hour'
    if (diffHours < 24) return `${diffHours} hours`

    return `${Math.floor(diffHours / 24)} days`
  }

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${slug}`}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Secrets</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage sensitive configuration for {project?.name}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Secret
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search secrets..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value
              setFilterActive(value === 'all' ? null : value === 'active')
            }}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Secrets</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Secrets list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : filteredSecrets.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {searchQuery || filterActive !== null ? 'No secrets found' : 'No secrets yet'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {searchQuery || filterActive !== null
              ? 'Try adjusting your search or filters'
              : 'Create your first secret to get started'}
          </p>
          {!searchQuery && filterActive === null && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Secret
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSecrets.map((secret) => (
            <motion.div
              key={secret.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                secret.active
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left side - secret info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg ${
                    secret.active
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    <Key className={`w-5 h-5 ${
                      secret.active
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500'
                    }`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {secret.name}
                      </h3>
                      {secret.active ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                          Inactive
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                        v{secret.version}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created {formatDate(secret.created_at)}</span>
                      </div>

                      {secret.rotation_reason && (
                        <div className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Reason:</span> {secret.rotation_reason}
                        </div>
                      )}

                      {secret.grace_period_ends_at && !secret.active && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          <span>Grace period: {formatGracePeriodEnd(secret.grace_period_ends_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - actions */}
                <div className="flex items-center gap-2">
                  {/* View button */}
                  <button
                    onClick={() => openDetailsModal(secret)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  </button>

                  {/* Version history button */}
                  <button
                    onClick={() => openVersionHistoryModal(secret)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                    title="View version history"
                  >
                    <History className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  </button>

                  {/* Rotate button (only for active secrets) */}
                  {secret.active && (
                    <button
                      onClick={() => openRotateModal(secret)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                      title="Rotate secret"
                    >
                      <RotateCw className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => openDeleteModal(secret)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                    title="Delete secret"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateSecretModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSecret}
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
            onConfirm={handleDeleteSecret}
            secret={selectedSecret}
          />

          <SecretRotateModal
            isOpen={showRotateModal}
            onClose={() => {
              setShowRotateModal(false)
              setSelectedSecret(null)
            }}
            onRotate={handleRotateSecret}
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
              // Fetch the specific version details
              secretsApi.getVersion(selectedSecret.id, parseInt(versionId.split('-')[0]) || 1).then((response) => {
                // Show details modal with version data
                setSelectedSecret({ ...selectedSecret, ...response.data } as any)
                setShowVersionHistoryModal(false)
                setShowDetailsModal(true)
              })
            }}
          />
        </>
      )}
    </div>
  )
}
