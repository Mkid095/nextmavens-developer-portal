'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Database,
  Shield,
  HardDrive,
  Activity,
  Code2,
  Key,
  Settings,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  slug: string
  tenant_id: string
  created_at: string
}

interface ApiKey {
  id: string
  name: string
  key_type: string
  key_prefix: string
  public_key: string
  created_at: string
}

type Tab = 'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys'

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'auth', label: 'Auth', icon: Shield },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'realtime', label: 'Realtime', icon: Activity },
  { id: 'graphql', label: 'GraphQL', icon: Code2 },
  { id: 'api-keys', label: 'API Keys', icon: Key },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [project, setProject] = useState<Project | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchProject()
    fetchApiKeys()
  }, [params.slug])

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/projects/by-slug?slug=${params.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || 'Failed to load project')
        return
      }
      const data = await res.json()
      setProject(data.project)
    } catch (err) {
      console.error('Failed to fetch project:', err)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading project...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Project not found</p>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-800">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const endpoints = {
    gateway: 'https://api.nextmavens.cloud',
    auth: 'https://auth.nextmavens.cloud',
    graphql: 'https://graphql.nextmavens.cloud',
    rest: 'https://api.nextmavens.cloud',
    realtime: 'wss://realtime.nextmavens.cloud',
    storage: 'https://storage.nextmavens.cloud',
  }

  const databaseUrl = `postgresql://nextmavens:Elishiba@95@nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u:5432/nextmavens?options=--search_path=tenant_${project.slug}`

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{project.name}</h1>
                <p className="text-xs text-slate-500">Created {new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Project Overview</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Quick Links</h3>
                  <a href={`https://studio.nextmavens.cloud/?project=${project.slug}`} target="_blank" rel="noopener noreferrer"
                    className="block p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-900">Open Studio Console</p>
                        <p className="text-sm text-emerald-700">Manage database, auth, and storage</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Project Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Project ID</span>
                      <code className="text-sm text-slate-900">{project.id}</code>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Tenant ID</span>
                      <code className="text-sm text-slate-900">{project.tenant_id}</code>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600">Slug</span>
                      <code className="text-sm text-slate-900">{project.slug}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Database Connection</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    PostgreSQL Connection String
                  </label>
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(databaseUrl, 'database-url')}
                      className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      {copied === 'database-url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                    <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-slate-100 font-mono break-all">{databaseUrl}</code>
                    </pre>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> Keep your database credentials secure. Never commit connection strings to public repositories.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">API Keys</h2>
                <button
                  onClick={() => {
                    const name = prompt('Enter API key name:')
                    if (name) {
                      fetch('/api/api-keys', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify({ name }),
                      }).then(() => fetchApiKeys())
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Create Key</span>
                </button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No API keys yet</p>
                  <button
                    onClick={() => {
                      const name = prompt('Enter API key name:')
                      if (name) {
                        fetch('/api/api-keys', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                          },
                          body: JSON.stringify({ name }),
                        }).then(() => fetchApiKeys())
                      }
                    }}
                    className="mt-4 text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    Create your first API key
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-900">{key.name}</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                              {key.key_type}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <code className="text-sm text-slate-600 bg-white px-2 py-1 rounded">
                                {key.key_type === 'secret' && !showSecret[key.id]
                                  ? `${key.key_prefix}••••••••`
                                  : key.public_key && key.public_key.length > 20
                                  ? key.public_key
                                  : `${key.key_prefix}•••••••• (recreate)`}
                              </code>
                              {key.key_type === 'secret' && key.public_key && key.public_key.length > 20 && (
                                <button
                                  onClick={() => setShowSecret({ ...showSecret, [key.id]: !showSecret[key.id] })}
                                  className="p-1 hover:bg-slate-200 rounded"
                                >
                                  {showSecret[key.id] ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                                </button>
                              )}
                              <button
                                onClick={() => handleCopy(key.public_key && key.public_key.length > 20 ? key.public_key : key.key_prefix, `key-${key.id}`)}
                                className="p-1 hover:bg-slate-200 rounded"
                              >
                                {copied === `key-${key.id}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">
                              Created {new Date(key.created_at).toLocaleString()}
                              {(!key.public_key || key.public_key.length <= 20) && (
                                <span className="text-amber-600 ml-2"> • Only prefix stored - recreate key</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Delete this API key?')) {
                              fetch(`/api/api-keys?id=${key.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                              }).then(() => fetchApiKeys())
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'graphql' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">GraphQL Endpoint</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    GraphQL URL
                  </label>
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(endpoints.graphql, 'graphql-url')}
                      className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      {copied === 'graphql-url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                    <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                      <code className="text-sm text-slate-100 font-mono">{endpoints.graphql}</code>
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Example Query</h3>
                  <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">{`query {
  users(limit: 10) {
    id
    email
    created_at
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Authentication</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Auth Endpoint</h3>
                  <code className="text-sm text-slate-700">{endpoints.auth}</code>
                </div>
                <p className="text-slate-600">
                  Use the Auth service to handle user registration, login, and session management.
                  Full documentation available in the{' '}
                  <Link href="/docs/auth" className="text-emerald-700 hover:text-emerald-800">
                    Auth docs
                  </Link>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Storage</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Storage Endpoint</h3>
                  <code className="text-sm text-slate-700">{endpoints.storage}</code>
                </div>
                <p className="text-slate-600">
                  Upload, manage, and serve files through the Storage service.
                  Full documentation available in the{' '}
                  <Link href="/docs/storage" className="text-emerald-700 hover:text-emerald-800">
                    Storage docs
                  </Link>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'realtime' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Realtime</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">WebSocket URL</h3>
                  <code className="text-sm text-slate-700">{endpoints.realtime}</code>
                </div>
                <p className="text-slate-600">
                  Connect to the Realtime service for live updates and subscriptions.
                  Full documentation available in the{' '}
                  <Link href="/docs" className="text-emerald-700 hover:text-emerald-800">
                    docs
                  </Link>.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
