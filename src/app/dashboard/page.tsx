'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  Key,
  Plus,
  Database,
  Shield,
  HardDrive,
  Globe,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface Developer {
  id: string
  email: string
  name: string
  organization?: string
}

interface ApiKey {
  id: string
  name: string
  public_key: string
  created_at: string
}

interface Project {
  id: string
  name: string
  slug: string
  created_at: string
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Modal states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [createdSecretKey, setCreatedSecretKey] = useState('')
  const [createdKeyName, setCreatedKeyName] = useState('')

  // Form states
  const [apiKeyName, setApiKeyName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDeveloperData()
    fetchApiKeys()
    fetchProjects()
  }, [router])

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  const fetchDeveloperData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/developer/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
        }
        return
      }

      const data = await res.json()
      setDeveloper(data.developer)
    } catch (err) {
      console.error('Failed to fetch developer:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.apiKeys || [])
      } else if (res.status === 401) {
        localStorage.clear()
        router.push('/login')
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      } else if (res.status === 401) {
        localStorage.clear()
        router.push('/login')
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const openCreateKeyModal = () => {
    setApiKeyName('')
    setError('')
    setShowApiKeyModal(true)
  }

  const closeCreateKeyModal = () => {
    setShowApiKeyModal(false)
    setApiKeyName('')
    setError('')
  }

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!apiKeyName.trim()) {
      setError('Please enter a name for this API key')
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: apiKeyName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }

      setCreatedSecretKey(data.secretKey)
      setCreatedKeyName(apiKeyName.trim())
      setShowApiKeyModal(false)
      setShowSecretModal(true)
      fetchApiKeys()
      addToast('success', 'API key created successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to create API key')
      addToast('error', err.message || 'Failed to create API key')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreateProjectModal = () => {
    setProjectName('')
    setError('')
    setShowProjectModal(true)
  }

  const closeCreateProjectModal = () => {
    setShowProjectModal(false)
    setProjectName('')
    setError('')
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!projectName.trim()) {
      setError('Please enter a project name')
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ project_name: projectName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      setShowProjectModal(false)
      fetchProjects()
      addToast('success', 'Project created successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
      addToast('error', err.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    addToast('success', 'Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopySecretKey = () => {
    navigator.clipboard.writeText(createdSecretKey)
    addToast('success', 'Secret key copied to clipboard')
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
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={closeCreateKeyModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Create API Key</h2>
                <button
                  onClick={closeCreateKeyModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleCreateApiKey}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    API Key Name
                  </label>
                  <input
                    type="text"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    placeholder="e.g., Production App"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> You will only see your secret key once. Make sure to copy it and store it securely.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeCreateKeyModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secret Key Display Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSecretModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">API Key Created</h2>
                <button
                  onClick={() => setShowSecretModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-slate-600 mb-4">
                  Your API key <strong>{createdKeyName}</strong> has been created successfully.
                </p>

                <div className="bg-slate-900 rounded-xl p-4">
                  <label className="block text-xs text-slate-400 mb-2">Secret Key (copy this now)</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-emerald-400 text-sm break-all">
                      {createdSecretKey}
                    </code>
                    <button
                      onClick={handleCopySecretKey}
                      className="p-2 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Copy className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Store this secret key securely. You won't be able to see it again after closing this dialog.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSecretModal(false)}
                className="w-full px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
              >
                I've saved my secret key
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={closeCreateProjectModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Create Project</h2>
                <button
                  onClick={closeCreateProjectModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., My Awesome App"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeCreateProjectModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{developer?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {developer?.name}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Key className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="font-medium text-slate-900">API Keys</span>
              </div>
              <div className="text-3xl font-semibold text-slate-900">{apiKeys.length}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-700" />
                </div>
                <span className="font-medium text-slate-900">Projects</span>
              </div>
              <div className="text-3xl font-semibold text-slate-900">{projects.length}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-700" />
                </div>
                <span className="font-medium text-slate-900">Services</span>
              </div>
              <div className="text-3xl font-semibold text-slate-900">5</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
                <button
                  onClick={openCreateKeyModal}
                  className="flex items-center gap-2 text-sm bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Key
                </button>
              </div>
              <div className="p-6 space-y-4">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm mb-4">No API keys yet. Create one to get started.</p>
                  </div>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 mb-1">{key.name}</div>
                          <code className="text-sm text-slate-600 block break-all">{key.public_key}</code>
                        </div>
                        <button
                          onClick={() => handleCopy(key.public_key, key.id)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition ml-2"
                          title="Copy to clipboard"
                        >
                          {copied === key.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
                <button
                  onClick={openCreateProjectModal}
                  className="flex items-center gap-2 text-sm bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
              <div className="p-6 space-y-4">
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm mb-4">No projects yet. Create one to get started.</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{project.name}</div>
                        <code className="text-xs text-slate-500">{project.slug}</code>
                      </div>
                      <Link
                        href={`/dashboard/projects/${project.slug}`}
                        className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                      >
                        Open
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Available Services</h2>
            </div>
            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/mcp" className="p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition">
                <Globe className="w-8 h-8 text-emerald-700 mb-3" />
                <h3 className="font-medium text-slate-900">MCP</h3>
                <p className="text-sm text-slate-600 mt-1">Model Context Protocol integration</p>
              </Link>

              <div className="p-4 border border-slate-200 rounded-xl">
                <Database className="w-8 h-8 text-blue-700 mb-3" />
                <h3 className="font-medium text-slate-900">Database</h3>
                <p className="text-sm text-slate-600 mt-1">PostgreSQL-powered queries</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl">
                <Shield className="w-8 h-8 text-purple-700 mb-3" />
                <h3 className="font-medium text-slate-900">Auth</h3>
                <p className="text-sm text-slate-600 mt-1">Authentication & authorization</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl">
                <HardDrive className="w-8 h-8 text-orange-700 mb-3" />
                <h3 className="font-medium text-slate-900">Storage</h3>
                <p className="text-sm text-slate-600 mt-1">File storage & CDN</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
