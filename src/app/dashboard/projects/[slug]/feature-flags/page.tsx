'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Shield,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Settings,
  Trash2,
  Plus,
  X,
  Info,
} from 'lucide-react'

interface FeatureFlag {
  name: string
  enabled: boolean
  scope: 'global' | 'project' | 'org'
  scope_id?: string
  metadata: Record<string, unknown>
}

interface FlagsResponse {
  success: boolean
  flags?: FeatureFlag[]
  error?: string
  code?: string
  details?: string
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

interface CreateFlagModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, enabled: boolean) => void
  existingFlags: FeatureFlag[]
}

function CreateFlagModal({ isOpen, onClose, onCreate, existingFlags }: CreateFlagModalProps) {
  const [flagName, setFlagName] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const availableFlags = [
    'signups_enabled',
    'provisioning_enabled',
    'storage_enabled',
    'realtime_enabled',
  ].filter((name) => !existingFlags.find((f) => f.name === name))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!flagName.trim()) {
      setError('Flag name is required')
      return
    }

    onCreate(flagName.trim(), enabled)
    setFlagName('')
    setEnabled(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Create Project Flag</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Flag Name
            </label>
            <select
              value={flagName}
              onChange={(e) => setFlagName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select a flag...</option>
              {availableFlags.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Project-specific flags override global flags
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Enable this flag
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
            >
              Create Flag
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function ProjectFeatureFlagsPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [fetching, setFetching] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    // Fetch project info to get project ID
    fetchProjectInfo()
  }, [router, slug])

  const fetchProjectInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/by-slug/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch project info')
      }

      const data = await res.json()
      if (data.success && data.project) {
        setProjectId(data.project.id)
        fetchFlags(data.project.id)
      }
    } catch (err: any) {
      console.error('Failed to fetch project info:', err)
      setError(err.message || 'Failed to fetch project info')
      setLoading(false)
    }
  }

  const fetchFlags = async (pid: string) => {
    setFetching(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${pid}/feature-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
          return
        }
        throw new Error(data.error || data.details || 'Failed to fetch feature flags')
      }

      setFlags(data.flags || [])
    } catch (err: any) {
      console.error('Failed to fetch feature flags:', err)
      setError(err.message || 'Failed to fetch feature flags')
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }

  const handleToggleFlag = async (flag: FeatureFlag) => {
    if (!projectId) return

    setUpdating(flag.name)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags/${flag.name}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !flag.enabled,
        }),
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to update feature flag')
      }

      setFlags((prev) =>
        prev.map((f) =>
          f.name === flag.name ? { ...f, enabled: !flag.enabled } : f
        )
      )

      addToast('success', `${flag.name} ${!flag.enabled ? 'enabled' : 'disabled'} successfully`)
    } catch (err: any) {
      console.error('Failed to update feature flag:', err)
      setError(err.message || 'Failed to update feature flag')
      addToast('error', err.message || 'Failed to update feature flag')
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    if (!projectId) return

    // Only allow deleting project-specific flags
    if (flag.scope !== 'project') {
      addToast('error', 'Can only delete project-specific flags')
      return
    }

    if (!confirm(`Are you sure you want to delete the project-specific override for "${flag.name}"? This will revert to the global flag value.`)) {
      return
    }

    setDeleting(flag.name)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags/${flag.name}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to delete feature flag')
      }

      // Remove the flag from the list and fetch updated flags
      await fetchFlags(projectId)
      addToast('success', `Project-specific flag "${flag.name}" removed`)
    } catch (err: any) {
      console.error('Failed to delete feature flag:', err)
      setError(err.message || 'Failed to delete feature flag')
      addToast('error', err.message || 'Failed to delete feature flag')
    } finally {
      setDeleting(null)
    }
  }

  const handleCreateFlag = async (name: string, enabled: boolean) => {
    if (!projectId) return

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/feature-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, enabled }),
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to create feature flag')
      }

      setShowCreateModal(false)
      await fetchFlags(projectId)
      addToast('success', `Project flag "${name}" created successfully`)
    } catch (err: any) {
      console.error('Failed to create feature flag:', err)
      setError(err.message || 'Failed to create feature flag')
      addToast('error', err.message || 'Failed to create feature flag')
    }
  }

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  const projectFlags = flags.filter((f) => f.scope === 'project')
  const globalFlags = flags.filter((f) => f.scope === 'global')

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/projects/${slug}`}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Feature Flags</h1>
                <p className="text-sm text-slate-600">{slug}</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Project Flag
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Project-Level Flags:</strong> Project-specific flags override global
                flags for this project only. Create a project-specific flag to customize behavior
                for this project without affecting other projects.
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Project-Specific Flags */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Project-Specific Flags</h2>
              <button
                onClick={() => projectId && fetchFlags(projectId)}
                disabled={fetching}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {projectFlags.length === 0 ? (
                <div className="p-8 text-center">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No project-specific flags</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Create a project-specific flag to override global defaults
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {projectFlags.map((flag) => {
                    const isUpdating = updating === flag.name
                    const isDeleting = deleting === flag.name
                    return (
                      <motion.div
                        key={flag.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-slate-900">{flag.name}</h3>
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-purple-100 text-purple-800 border-purple-200">
                                project
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                                  flag.enabled
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {flag.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              {flag.enabled
                                ? 'This feature is enabled for this project (overrides global setting)'
                                : 'This feature is disabled for this project (overrides global setting)'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleFlag(flag)}
                              disabled={isUpdating || isDeleting}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                flag.enabled
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Updating...
                                </>
                              ) : flag.enabled ? (
                                <>
                                  <ToggleRight className="w-5 h-5" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-5 h-5" />
                                  Disabled
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteFlag(flag)}
                              disabled={isDeleting || isUpdating}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove project-specific override"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Global Flags (Reference) */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Global Flags (Reference)</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden opacity-75">
              <div className="divide-y divide-slate-200">
                {globalFlags.map((flag) => (
                  <div key={flag.name} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-slate-900">{flag.name}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                        global
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                          flag.enabled
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {flag.enabled ? 'Active globally' : 'Disabled globally'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <CreateFlagModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateFlag}
        existingFlags={flags}
      />
    </div>
  )
}
