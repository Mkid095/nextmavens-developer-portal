'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ChevronRight,
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
  X,
  AlertCircle,
  LucideIcon,
  RefreshCw,
  ShieldAlert,
  Clock,
  BarChart3,
  Globe,
  Server,
  ChevronDown,
  Info,
} from 'lucide-react'
import SuspensionBanner from '@/components/SuspensionBanner'
import QuotaWarningBanner from '@/components/QuotaWarningBanner'
import ServiceTab from '@/components/ServiceTab'
import CreateApiKeyModal, { type CreateKeyData } from '@/components/CreateApiKeyModal'
import DeletionPreviewModal from '@/components/DeletionPreviewModal'
import CodeBlockEnhancer from '@/components/docs/CodeBlockEnhancer'
import type { ApiKeyType, ApiKeyEnvironment } from '@/lib/types/api-key.types'

interface Project {
  id: string
  name: string
  slug: string
  tenant_id: string
  created_at: string
  environment?: 'prod' | 'dev' | 'staging'
}

interface ApiKey {
  id: string
  name: string
  key_type: string
  key_prefix: string
  public_key: string
  created_at: string
  status?: string
  expires_at?: string
  last_used?: string
  usage_count?: number
}

/**
 * Key usage statistics from GET /api/keys/:id/usage
 * US-005: Create Key Usage API
 */
interface KeyUsageStats {
  keyId: string
  usageCount: number
  lastUsed: string | null
  createdAt: string
  usageByTimePeriod: {
    last7Days: number
    last30Days: number
  }
  successErrorRate: {
    total: number
    success: number
    error: number
    successRate: number
    errorRate: number
  }
}

interface NewKeyResponse {
  apiKey: ApiKey
  secretKey?: string
}

interface TabConfig {
  id: Tab
  label: string
  icon: LucideIcon
}

type Tab = 'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys'

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'auth', label: 'Auth', icon: Shield },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'realtime', label: 'Realtime', icon: Activity },
  { id: 'graphql', label: 'GraphQL', icon: Code2 },
  { id: 'api-keys', label: 'API Keys', icon: Key },
]

/**
 * Suspension reason interface
 */
interface SuspensionReason {
  cap_type: string
  current_value: number
  limit_exceeded: number
  details?: string
}

/**
 * Suspension record interface
 */
interface SuspensionRecord {
  id: string
  project_id: string
  reason: SuspensionReason
  cap_exceeded: string
  suspended_at: string
  resolved_at: string | null
  notes?: string
}

/**
 * Suspension status API response
 */
interface SuspensionStatusResponse {
  suspended: boolean
  suspension?: SuspensionRecord
  message?: string
}

/**
 * Key type configuration for US-011: Enhanced Key Creation UI
 */
const KEY_TYPE_CONFIG = {
  public: {
    name: 'Public Key',
    icon: Globe,
    color: 'blue',
    description: 'Safe for client-side code. Can be exposed in browsers and mobile apps.',
    warning: 'This key is intended for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code.',
    defaultScopes: ['db:select', 'storage:read', 'auth:signin', 'realtime:subscribe'],
    riskLevel: 'Low',
    useCases: ['Web applications', 'Mobile apps', 'Public APIs', 'Read-only data access'],
  },
  secret: {
    name: 'Secret Key',
    icon: Key,
    color: 'purple',
    description: 'Server-side key with full CRUD access. Never expose in client code.',
    warning: 'This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments where it cannot be accessed by users.',
    defaultScopes: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'auth:manage', 'graphql:execute'],
    riskLevel: 'High',
    useCases: ['Backend services', 'Server-to-server communication', 'API integrations', 'Data processing'],
  },
  service_role: {
    name: 'Service Role Key',
    icon: Shield,
    color: 'red',
    description: 'Bypasses row-level security for admin tasks. Use with extreme caution.',
    warning: 'WARNING: This is a service role key that bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code. Only use this key in trusted server-side environments for admin operations.',
    defaultScopes: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'auth:manage', 'graphql:execute', 'realtime:subscribe', 'realtime:publish'],
    riskLevel: 'Very High',
    useCases: ['Administrative tasks', 'Data migrations', 'Background jobs', 'Trusted operations'],
  },
  mcp: {
    name: 'MCP Token',
    icon: Server,
    color: 'teal',
    description: 'AI/IDE integration token for Model Context Protocol.',
    warning: 'Share this token only with trusted AI tools and IDEs. Scope depends on access level selected.',
    defaultScopes: ['db:select', 'storage:read', 'realtime:subscribe'],
    riskLevel: 'Medium',
    useCases: ['AI-powered code generation', 'IDE integrations', 'Automated workflows', 'AI-assisted operations'],
  },
}

/**
 * All available scopes organized by service
 */
const SCOPES_BY_SERVICE = {
  'Database (db)': ['db:select', 'db:insert', 'db:update', 'db:delete'],
  'Storage': ['storage:read', 'storage:write'],
  'Auth': ['auth:signin', 'auth:signup', 'auth:manage'],
  'Realtime': ['realtime:subscribe', 'realtime:publish'],
  'GraphQL': ['graphql:execute'],
}

/**
 * Scope descriptions for US-011
 */
const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'db:select': 'Read data from database',
  'db:insert': 'Insert new records',
  'db:update': 'Update existing records',
  'db:delete': 'Delete records',
  'storage:read': 'Read/download files',
  'storage:write': 'Upload files',
  'auth:signin': 'Sign in users',
  'auth:signup': 'Register new users',
  'auth:manage': 'Full user management',
  'realtime:subscribe': 'Subscribe to real-time updates',
  'realtime:publish': 'Publish real-time messages',
  'graphql:execute': 'Execute GraphQL queries',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [project, setProject] = useState<Project | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [suspensionStatus, setSuspensionStatus] = useState<SuspensionRecord | null>(null)
  const [suspensionLoading, setSuspensionLoading] = useState(true)
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'live' | 'test' | 'dev'>('live')
  const [keySubmitting, setKeySubmitting] = useState(false)
  const [keyError, setKeyError] = useState('')
  // US-008, US-009, US-010: Rotation and revocation modals
  const [showRotateModal, setShowRotateModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [rotateSubmitting, setRotateSubmitting] = useState(false)
  const [revokeSubmitting, setRevokeSubmitting] = useState(false)
  // US-006: Key usage stats
  const [keyUsageStats, setKeyUsageStats] = useState<Record<string, KeyUsageStats>>({})
  const [usageStatsLoading, setUsageStatsLoading] = useState<Record<string, boolean>>({})
  // US-011: Enhanced key creation state
  const [selectedKeyType, setSelectedKeyType] = useState<'public' | 'secret' | 'service_role' | 'mcp'>('public')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [showScopeDetails, setShowScopeDetails] = useState(false)
  const [showUsageExamples, setShowUsageExamples] = useState(false)
  // US-010: Deletion preview modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      fetchSuspensionStatus()
    }
  }, [project])

  useEffect(() => {
    fetchProject()
    fetchApiKeys()
  }, [params.slug])

  // US-006: Fetch usage stats when apiKeys change
  useEffect(() => {
    if (apiKeys.length > 0) {
      apiKeys.forEach((key) => {
        fetchKeyUsageStats(key.id)
      })
    }
  }, [apiKeys])

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken')
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
      const token = localStorage.getItem('accessToken')
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

  // US-006: Fetch key usage statistics
  const fetchKeyUsageStats = async (keyId: string) => {
    setUsageStatsLoading((prev) => ({ ...prev, [keyId]: true }))
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/keys/${keyId}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: KeyUsageStats = await res.json()
        setKeyUsageStats((prev) => ({ ...prev, [keyId]: data }))
      }
    } catch (err) {
      console.error(`Failed to fetch usage stats for key ${keyId}:`, err)
    } finally {
      setUsageStatsLoading((prev) => ({ ...prev, [keyId]: false }))
    }
  }

  // US-006: Check if key is inactive (>30 days since last use)
  const isKeyInactive = (key: ApiKey): boolean => {
    if (!key.last_used) return false
    const lastUsed = new Date(key.last_used)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return lastUsed < thirtyDaysAgo
  }

  // US-006: Format last used date
  const formatLastUsed = (lastUsed: string | null | undefined): string => {
    if (!lastUsed) return 'Never'
    const date = new Date(lastUsed)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const fetchSuspensionStatus = async () => {
    if (!project) return

    setSuspensionLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project.id}/suspensions`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data: SuspensionStatusResponse = await res.json()
        if (data.suspended && data.suspension) {
          setSuspensionStatus(data.suspension)
        } else {
          setSuspensionStatus(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch suspension status:', err)
    } finally {
      setSuspensionLoading(false)
    }
  }

  const openCreateKeyModal = () => {
    setNewKeyName('')
    setNewKeyEnvironment('live')
    setKeyError('')
    // US-011: Reset enhanced key creation state
    setSelectedKeyType('public')
    setSelectedScopes(KEY_TYPE_CONFIG.public.defaultScopes)
    setShowScopeDetails(false)
    setShowUsageExamples(false)
    setShowCreateKeyModal(true)
  }

  const closeCreateKeyModal = () => {
    setShowCreateKeyModal(false)
    setNewKeyName('')
    setNewKeyEnvironment('live')
    setKeyError('')
    // US-011: Reset enhanced key creation state
    setSelectedKeyType('public')
    setSelectedScopes(KEY_TYPE_CONFIG.public.defaultScopes)
    setShowScopeDetails(false)
    setShowUsageExamples(false)
  }

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setKeyError('')

    if (!newKeyName.trim()) {
      setKeyError('Please enter a name for this API key')
      return
    }

    // US-011: Validate scopes
    if (selectedScopes.length === 0) {
      setKeyError('Please select at least one scope for this API key')
      return
    }

    setKeySubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // US-011: Include key_type in request
        body: JSON.stringify({
          name: newKeyName.trim(),
          key_type: selectedKeyType,
          environment: newKeyEnvironment,
          scopes: selectedScopes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }

      setNewKey(data)
      // US-011: Show usage examples after creation
      setShowUsageExamples(true)
      closeCreateKeyModal()
      fetchApiKeys()
    } catch (err: any) {
      setKeyError(err.message || 'Failed to create API key')
    } finally {
      setKeySubmitting(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // US-008: Open rotation warning modal
  const openRotateModal = (keyId: string) => {
    setSelectedKeyId(keyId)
    setShowRotateModal(true)
  }

  const closeRotateModal = () => {
    setShowRotateModal(false)
    setSelectedKeyId(null)
  }

  // US-009: Handle key rotation
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

      // Show the new key
      setNewKey({
        apiKey: data.newKey,
        secretKey: data.secretKey,
      })

      closeRotateModal()
      fetchApiKeys()
    } catch (err: any) {
      console.error('Failed to rotate key:', err)
      alert(err.message || 'Failed to rotate API key')
    } finally {
      setRotateSubmitting(false)
    }
  }

  // US-010: Open revoke confirmation modal
  const openRevokeModal = (keyId: string) => {
    setSelectedKeyId(keyId)
    setShowRevokeModal(true)
  }

  const closeRevokeModal = () => {
    setShowRevokeModal(false)
    setSelectedKeyId(null)
  }

  // US-010: Handle key revocation
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

      closeRevokeModal()
      fetchApiKeys()
    } catch (err: any) {
      console.error('Failed to revoke key:', err)
      alert(err.message || 'Failed to revoke API key')
    } finally {
      setRevokeSubmitting(false)
    }
  }

  // US-011: Handle key type selection change
  const handleKeyTypeChange = (keyType: 'public' | 'secret' | 'service_role' | 'mcp') => {
    setSelectedKeyType(keyType)
    // Pre-populate scopes based on key type
    setSelectedScopes(KEY_TYPE_CONFIG[keyType].defaultScopes)
  }

  // US-011: Handle scope checkbox change
  const handleScopeToggle = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    )
  }

  // US-011: Select all scopes for a service
  const selectAllScopesForService = (serviceScopes: string[]) => {
    setSelectedScopes(prev => {
      const newScopes = [...prev]
      serviceScopes.forEach(scope => {
        if (!newScopes.includes(scope)) {
          newScopes.push(scope)
        }
      })
      return newScopes
    })
  }

  // US-011: Deselect all scopes for a service
  const deselectAllScopesForService = (serviceScopes: string[]) => {
    setSelectedScopes(prev => prev.filter(s => !serviceScopes.includes(s)))
  }

  // US-010: Handle project deletion
  const handleDeleteProject = async () => {
    setDeleteSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to delete project' }))
        throw new Error(data.error || 'Failed to delete project')
      }

      // Redirect to dashboard after successful deletion
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Failed to delete project:', err)
      throw err
    } finally {
      setDeleteSubmitting(false)
    }
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
    <>
      <CodeBlockEnhancer />
      <div className="min-h-screen bg-[#F3F5F7]">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-slate-900">{project.name}</h1>
                  {project.environment && (
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        project.environment === 'prod'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : project.environment === 'dev'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      {project.environment === 'prod'
                        ? 'Production'
                        : project.environment === 'dev'
                          ? 'Development'
                          : 'Staging'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Created {new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Suspension Banner */}
        {suspensionStatus && (
          <SuspensionBanner
            suspension={suspensionStatus}
            onRequestReview={() => {
              window.location.href = 'mailto:support@nextmavens.cloud?subject=Project Suspension Review Request'
            }}
          />
        )}

        {/* Quota Warning Banner - US-005 */}
        {project && <QuotaWarningBanner projectId={project.id} />}

        {/* Production Environment Warning Banner - US-009 */}
        {project?.environment === 'prod' && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Production Environment</h3>
              <p className="text-xs text-amber-800 mt-1">
                You are working in a production environment. Changes here affect live users and data. Standard rate limits and auto-suspend are enabled.
              </p>
            </div>
          </div>
        )}

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
                  <Link href={`/studio/${project.slug}`}
                    className="block p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-900">Open Studio Console</p>
                        <p className="text-sm text-emerald-700">Manage database, auth, and storage</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-emerald-700 ml-auto" />
                    </div>
                  </Link>
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

              {/* US-010: Delete Project Section */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-red-900">Danger Zone</h3>
                    <p className="text-sm text-slate-600 mt-1">Delete this project and all its data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete Project</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <ServiceTab
              serviceName="Database"
              overview="A powerful PostgreSQL-powered data service with auto-generated REST & GraphQL APIs. Store, query, and manage your application data with full SQL capabilities while enjoying the convenience of instant API generation."
              whenToUse="Use the Database service for any application that needs persistent data storage - user profiles, content management, e-commerce catalogs, analytics data, or any structured data. Perfect for applications requiring complex queries, transactions, and relational data modeling."
              quickStart={
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-100 font-mono">npm install nextmavens-js</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Query Example</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`// Query data
const { data, error } = await client
  .from('users')
  .select('*')
  .limit(10)

// Insert data
const { data } = await client
  .from('users')
  .insert({ email: 'user@example.com' })`}</code>
                    </pre>
                  </div>
                </div>
              }
              connectionDetails={
                <div className="space-y-4">
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
                      <strong>Security Warning:</strong> Keep your database credentials secure. Never commit connection strings to public repositories or expose them in client-side code.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">REST API</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.rest}</code>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">GraphQL API</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.graphql}</code>
                    </div>
                  </div>
                </div>
              }
              docsUrl="https://docs.nextmavens.cloud/database"
            />
          )}

          {activeTab === 'api-keys' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">API Keys</h2>
                <button
                  onClick={openCreateKeyModal}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Create Key</span>
                </button>
              </div>

              {/* US-007: API Keys guidance section */}
              <div className="mb-6 space-y-4">
                {/* Key Types Explained */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Understanding API Key Types</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-medium text-slate-900">publishable</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Safe for client-side code. Can only read data and create resources.</p>
                      <p className="text-xs text-slate-500"><strong>Use for:</strong> Frontend apps, mobile apps, public APIs</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-slate-900">secret</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Full access to all operations. Never expose in client-side code.</p>
                      <p className="text-xs text-slate-500"><strong>Use for:</strong> Backend servers, CLI tools, scripts</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-purple-600" />
                        <h4 className="font-medium text-slate-900">service_role</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">Bypasses row-level security. Use with extreme caution.</p>
                      <p className="text-xs text-slate-500"><strong>Use for:</strong> Admin tasks, migrations, trusted services</p>
                    </div>
                  </div>
                </div>

                {/* Security Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Security Best Practices</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• Never commit API keys to public repositories</li>
                        <li>• Use environment variables to store keys</li>
                        <li>• Rotate keys regularly (use the rotate button)</li>
                        <li>• Revoke unused keys immediately</li>
                        <li>• Use <strong>publishable</strong> keys in frontend code only</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Integration Code */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                  <h3 className="font-semibold text-emerald-900 mb-3">Quick Integration</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Using the SDK</p>
                      <div className="relative group">
                        <button
                          onClick={() => handleCopy(`import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`, 'sdk-integration')}
                          className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          {copied === 'sdk-integration' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                        <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                          <code className="text-sm text-slate-300 font-mono">{`import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`}</code>
                        </pre>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Using REST API</p>
                      <div className="relative group">
                        <button
                          onClick={() => handleCopy(`curl -X GET "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_API_KEY"`, 'rest-integration')}
                          className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          {copied === 'rest-integration' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                        <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                          <code className="text-sm text-slate-300 font-mono">{`curl -X GET "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {newKey && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-emerald-900">New API Key Created</h3>
                      <p className="text-sm text-emerald-700">Copy these keys now. You won't see the secret key again.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowUsageExamples(true)}
                        className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                      >
                        View Usage Examples
                      </button>
                      <button
                        onClick={() => setNewKey(null)}
                        className="text-emerald-600 hover:text-emerald-800"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Public Key</label>
                      <div className="flex gap-2">
                        <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-slate-200 break-all">{newKey.apiKey.public_key}</code>
                        <button
                          onClick={() => handleCopy(newKey.apiKey.public_key, 'new-public')}
                          className="px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50"
                        >
                          {copied === 'new-public' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                        </button>
                      </div>
                    </div>
                    {newKey.secretKey && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key</label>
                        <div className="flex gap-2">
                          <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-slate-200 break-all">{newKey.secretKey}</code>
                          <button
                            onClick={() => handleCopy(newKey.secretKey!, 'new-secret')}
                            className="px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50"
                          >
                            {copied === 'new-secret' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No API keys yet</p>
                  <button
                    onClick={openCreateKeyModal}
                    className="mt-4 text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    Create your first API key
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => {
                    // Use newKey values if this is the newly created key
                    const isNewKey = newKey && newKey.apiKey.id === key.id
                    const displayKey = isNewKey ? newKey.apiKey : key
                    const hasFullKey = isNewKey || (key.public_key && key.public_key.length > 20)
                    // US-006: Usage stats
                    const usageStats = keyUsageStats[key.id]
                    const loadingStats = usageStatsLoading[key.id]
                    const inactive = isKeyInactive(key)

                    return (
                    <div key={key.id} className={`p-4 rounded-lg border ${inactive ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-900">{displayKey.name}</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                              {displayKey.key_type}
                            </span>
                            {isNewKey && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                New
                              </span>
                            )}
                            {/* US-006: Visual indicator for inactive keys */}
                            {inactive && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <code className="text-sm text-slate-600 bg-white px-2 py-1 rounded">
                                {displayKey.key_type === 'secret' && !showSecret[key.id]
                                  ? `${displayKey.key_prefix}••••••••`
                                  : hasFullKey
                                  ? displayKey.public_key
                                  : `${displayKey.key_prefix}•••••••• (recreate)`}
                              </code>
                              {displayKey.key_type === 'secret' && hasFullKey && (
                                <button
                                  onClick={() => setShowSecret({ ...showSecret, [key.id]: !showSecret[key.id] })}
                                  className="p-1 hover:bg-slate-200 rounded"
                                >
                                  {showSecret[key.id] ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                                </button>
                              )}
                              <button
                                onClick={() => handleCopy(hasFullKey ? displayKey.public_key : displayKey.key_prefix, `key-${key.id}`)}
                                className="p-1 hover:bg-slate-200 rounded"
                              >
                                {copied === `key-${key.id}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">
                              Created {new Date(key.created_at).toLocaleString()}
                              {!hasFullKey && (
                                <span className="text-amber-600 ml-2"> • Only prefix stored - recreate key</span>
                              )}
                            </p>
                            {/* US-006: Usage stats display */}
                            {!loadingStats && usageStats && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <div className="flex flex-wrap gap-4 text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    <span>Used <strong className="text-slate-900">{usageStats.usageCount.toLocaleString()}</strong> times</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Last: <strong className="text-slate-900">{formatLastUsed(usageStats.lastUsed)}</strong></span>
                                  </div>
                                  {/* US-006: Success/error rate */}
                                  {usageStats.successErrorRate.total > 0 && (
                                                                    <div className="flex items-center gap-1.5">
                                      <span className={usageStats.successErrorRate.successRate >= 95 ? 'text-emerald-600' : usageStats.successErrorRate.successRate >= 80 ? 'text-amber-600' : 'text-red-600'}>
                                        <strong>{usageStats.successErrorRate.successRate}%</strong> success
                                      </span>
                                      <span className="text-slate-400">•</span>
                                      <span className="text-slate-500">{usageStats.successErrorRate.total} requests</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* US-009: Rotate button */}
                          <button
                            onClick={() => openRotateModal(key.id)}
                            disabled={key.status === 'revoked' || key.status === 'expired'}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Rotate key"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          {/* US-010: Revoke button */}
                          <button
                            onClick={() => openRevokeModal(key.id)}
                            disabled={key.status === 'revoked' || key.status === 'expired'}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Revoke key"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm('Delete this API key? This cannot be undone.')) {
                                fetch(`/api/api-keys?id=${key.id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                                }).then(() => fetchApiKeys())
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'graphql' && (
            <ServiceTab
              serviceName="GraphQL"
              overview="A powerful GraphQL API automatically generated from your database schema. Query your data with flexible, type-safe GraphQL operations. No manual API development required - the schema reflects your database structure in real-time."
              whenToUse="Use the GraphQL service when you need flexible, efficient data fetching. Perfect for frontend applications, mobile apps, and any scenario where clients need to query exactly the data they need. Ideal for complex data relationships, nested queries, and avoiding over-fetching."
              quickStart={
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-100 font-mono">npm install @nextmavens/graphql</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`import { createGraphQLClient } from '@nextmavens/graphql'

const graphql = createGraphQLClient({
  url: '${endpoints.graphql}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Query Example</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`const { data, error } = await graphql.query(\`query {
  users(limit: 10, order_by: { created_at: desc }) {
    id
    email
    created_at
    profiles {
      full_name
      avatar_url
    }
  }
}\`)`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Mutation Example</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`const { data, error } = await graphql.mutation(\`mutation {
  insert_users_one(object: {
    email: "user@example.com"
    profiles: {
      data: { full_name: "John Doe" }
    }
  }) {
    id
    email
  }
}\`)`}</code>
                    </pre>
                  </div>
                </div>
              }
              connectionDetails={
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      GraphQL Endpoint
                    </label>
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(endpoints.graphql, 'graphql-endpoint')}
                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        {copied === 'graphql-endpoint' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm text-slate-100 font-mono">{endpoints.graphql}</code>
                      </pre>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-800">
                      <strong>GraphQL Playground:</strong> Explore your GraphQL API schema and test queries using the built-in{' '}
                      <Link href={`/studio/${project.slug}/graphql`} className="underline font-medium">
                        GraphQL Playground
                      </Link>
                      .
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Schema</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">Auto-generated</code>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Subscriptions</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">WebSocket (Realtime)</code>
                    </div>
                  </div>
                </div>
              }
              docsUrl="https://docs.nextmavens.cloud/graphql"
            />
          )}

          {activeTab === 'auth' && (
            <ServiceTab
              serviceName="Auth"
              overview="A complete authentication service that handles user registration, login, session management, and JWT token generation. Built-in security features including password hashing, token refresh, and session management."
              whenToUse="Use the Auth service whenever your application needs user authentication and authorization. Perfect for user accounts, admin panels, API authentication, and any scenario requiring secure access control. Supports email/password authentication with plans for social providers (OAuth)."
              quickStart={
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-100 font-mono">npm install @nextmavens/auth</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`import { createAuthClient } from '@nextmavens/auth'

const auth = createAuthClient({
  url: '${endpoints.auth}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Sign Up Example</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`const { user, error } = await auth.signUp({
  email: 'user@example.com',
  password: 'secure_password'
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Sign In Example</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`const { session, error } = await auth.signIn({
  email: 'user@example.com',
  password: 'secure_password'
})`}</code>
                    </pre>
                  </div>
                </div>
              }
              connectionDetails={
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Auth Endpoint
                    </label>
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(endpoints.auth, 'auth-endpoint')}
                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        {copied === 'auth-endpoint' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm text-slate-100 font-mono">{endpoints.auth}</code>
                      </pre>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>User Management:</strong> Manage users through the{' '}
                      <Link href={`/studio/${project.slug}/auth/users`} className="underline font-medium">
                        Studio Console
                      </Link>
                      {' '}or use the Auth API for programmatic access.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Token Type</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">JWT (RS256)</code>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Token Expiration</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">1 hour (refreshable)</code>
                    </div>
                  </div>
                </div>
              }
              docsUrl="https://docs.nextmavens.cloud/auth"
            />
          )}

          {activeTab === 'storage' && (
            <ServiceTab
              serviceName="Storage"
              overview="A transparent storage abstraction that automatically routes files to optimal backends. Raw files go to Telegram for permanent storage, while web-optimized assets are served through Cloudinary CDN. Zero configuration needed - just upload and we handle the rest."
              whenToUse="Use the Storage service for all file handling needs - user uploads, images, videos, documents, backups, and static assets. Perfect for profile pictures, document management, media galleries, and any application requiring file storage with automatic optimization and CDN delivery."
              quickStart={
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-100 font-mono">npm install @nextmavens/storage</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`import { createStorageClient } from '@nextmavens/storage'

const storage = createStorageClient({
  url: '${endpoints.storage}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Upload File Example</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`const file = document.querySelector('input[type="file"]').files[0]

const { data, error } = await storage.upload({
  file: file,
  bucket: 'uploads',
  path: \`avatars/\${Date.now()}_\${file.name}\`
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Get Public URL Example</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`const { publicUrl } = storage.getPublicUrl({
  bucket: 'uploads',
  path: 'avatars/1234567890_profile.jpg'
})

// &lt;img src={publicUrl} alt="Profile" /&gt;`}</code>
                    </pre>
                  </div>
                </div>
              }
              connectionDetails={
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Storage Endpoint
                    </label>
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(endpoints.storage, 'storage-endpoint')}
                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        {copied === 'storage-endpoint' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm text-slate-100 font-mono">{endpoints.storage}</code>
                      </pre>
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      <strong>Bucket Management:</strong> Manage storage buckets through the{' '}
                      <Link href={`/studio/${project.slug}/storage/buckets`} className="underline font-medium">
                        Studio Console
                      </Link>
                      . Create buckets for different file types and configure access rules.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Raw Storage</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">Telegram</code>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">CDN/Optimization</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">Cloudinary</code>
                    </div>
                  </div>
                </div>
              }
              docsUrl="https://docs.nextmavens.cloud/storage"
            />
          )}

          {activeTab === 'realtime' && (
            <ServiceTab
              serviceName="Realtime"
              overview="A real-time data synchronization service powered by PostgreSQL Change Data Capture (CDC). Subscribe to database changes and receive instant updates via WebSocket connections. Perfect for collaborative apps, live dashboards, and multi-user experiences."
              whenToUse="Use the Realtime service when you need live data updates in your application. Ideal for collaborative editing, live dashboards, chat applications, notifications, activity feeds, and any scenario where users need to see changes instantly across multiple clients."
              quickStart={
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-100 font-mono">npm install @nextmavens/realtime</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`import { createRealtimeClient } from '@nextmavens/realtime'

const realtime = createRealtimeClient({
  url: '${endpoints.realtime}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Connect to WebSocket</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`// Connect to the realtime service
const { socket, error } = await realtime.connect()

// Handle connection events
socket.on('connected', () => {
  console.log('Connected to realtime!')
})

socket.on('disconnected', () => {
  console.log('Disconnected from realtime')
})`}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Subscribe to Table Changes</h4>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">{`// Subscribe to all changes on the 'users' table
const subscription = socket
  .channel('users')
  .on('INSERT', (payload) => {
    console.log('New user:', payload.new)
  })
  .on('UPDATE', (payload) => {
    console.log('User updated:', payload.new)
  })
  .subscribe()`}</code>
                    </pre>
                  </div>
                </div>
              }
              connectionDetails={
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      WebSocket URL
                    </label>
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(endpoints.realtime, 'realtime-endpoint')}
                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        {copied === 'realtime-endpoint' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm text-slate-100 font-mono">{endpoints.realtime}</code>
                      </pre>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Change Data Capture:</strong> Realtime uses PostgreSQL's logical replication to capture row-level changes. All INSERT, UPDATE, and DELETE operations are broadcast in real-time to subscribed clients.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Protocol</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">WebSocket</code>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Latency</p>
                      <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">&lt; 100ms</code>
                    </div>
                  </div>
                </div>
              }
              docsUrl="https://docs.nextmavens.cloud/realtime"
            />
          )}
        </motion.div>
      </div>

      {/* US-011: Enhanced Create API Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeCreateKeyModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create API Key</h2>
                <p className="text-sm text-slate-600 mt-1">Choose the right key type for your use case</p>
              </div>
              <button
                onClick={closeCreateKeyModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreateApiKey}>
              {/* Step 1: Key Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Web App"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Step 2: Key Type Selector Cards */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Key Type
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {(Object.keys(KEY_TYPE_CONFIG) as Array<keyof typeof KEY_TYPE_CONFIG>).map((type) => {
                    const config = KEY_TYPE_CONFIG[type]
                    const IconComponent = config.icon
                    const isSelected = selectedKeyType === type

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedKeyType(type)
                          setSelectedScopes(config.defaultScopes)
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          isSelected
                            ? `${config.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                                config.color === 'purple' ? 'border-purple-500 bg-purple-50' :
                                config.color === 'red' ? 'border-red-500 bg-red-50' :
                                config.color === 'teal' ? 'border-teal-500 bg-teal-50' :
                                'border-emerald-500 bg-emerald-50'}`
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            config.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            config.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                            config.color === 'red' ? 'bg-red-100 text-red-700' :
                            config.color === 'teal' ? 'bg-teal-100 text-teal-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900">{config.name}</h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                config.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                                config.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                config.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {config.riskLevel} Risk
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{config.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {config.useCases.slice(0, 2).map((useCase) => (
                                <span key={useCase} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                  {useCase}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 3: Environment Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Environment
                </label>
                <select
                  value={newKeyEnvironment}
                  onChange={(e) => setNewKeyEnvironment(e.target.value as 'live' | 'test' | 'dev')}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
                >
                  <option value="live">Production (Live)</option>
                  <option value="test">Staging (Test)</option>
                  <option value="dev">Development (Dev)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  The key prefix will include this environment (e.g., pk_live_, pk_test_, pk_dev_)
                </p>
              </div>

              {/* Step 4: Scope Checkboxes */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Permissions (Scopes)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowScopeDetails(!showScopeDetails)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    {showScopeDetails ? 'Hide' : 'Show'} details
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(SCOPES_BY_SERVICE).map(([service, scopes]) => (
                    <div key={service} className="border border-slate-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">{service}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {scopes.map((scope) => (
                          <label
                            key={scope}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                              selectedScopes.includes(scope)
                                ? 'bg-emerald-50 border border-emerald-200'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedScopes.includes(scope)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedScopes([...selectedScopes, scope])
                                } else {
                                  setSelectedScopes(selectedScopes.filter(s => s !== scope))
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-slate-700">{scope}</span>
                              {showScopeDetails && SCOPE_DESCRIPTIONS[scope] && (
                                <p className="text-xs text-slate-500 mt-0.5">{SCOPE_DESCRIPTIONS[scope]}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {selectedScopes.length} scope(s) selected
                </p>
              </div>

              {/* Warning for service role keys */}
              {selectedKeyType === 'service_role' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Service Role Key Warning</h4>
                      <p className="text-sm text-red-800">
                        This key bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code. Only use this key in trusted server-side environments for admin operations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning for secret keys */}
              {selectedKeyType === 'secret' && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">Secret Key Warning</h4>
                      <p className="text-sm text-amber-800">
                        This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments where it cannot be accessed by users.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info for public keys */}
              {selectedKeyType === 'public' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Public Key</h4>
                      <p className="text-sm text-blue-800">
                        This key is safe for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {keyError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{keyError}</span>
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
                  disabled={keySubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={keySubmitting}
                  className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {keySubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Key
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* US-008: Rotation Warning Modal */}
      {showRotateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeRotateModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Rotate API Key</h2>
              <button
                onClick={closeRotateModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Important Information</h3>
                  <p className="text-sm text-amber-800 mb-2">
                    Rotating this key will create a new key version. The old key will remain active for a <strong>24-hour grace period</strong> to give you time to update your applications.
                  </p>
                  <p className="text-sm text-amber-800">
                    After 24 hours, the old key will be automatically expired and will no longer work.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">What happens next:</h4>
                <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
                  <li>A new API key will be generated</li>
                  <li>You'll see the new key (shown once - copy it!)</li>
                  <li>The old key will expire in 24 hours</li>
                  <li>Update your applications to use the new key</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeRotateModal}
                disabled={rotateSubmitting}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRotateKey}
                disabled={rotateSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rotateSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Rotating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Rotate Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* US-010: Revoke Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeRevokeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Revoke API Key</h2>
              <button
                onClick={closeRevokeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Warning: Immediate Action</h3>
                  <p className="text-sm text-red-800">
                    Revoking this API key will <strong>immediately invalidate it</strong>. Any applications or services using this key will stop working right away.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Before revoking:</h4>
                <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside">
                  <li>Ensure no active applications are using this key</li>
                  <li>Consider rotating instead to maintain uptime</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeRevokeModal}
                disabled={revokeSubmitting}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeKey}
                disabled={revokeSubmitting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {revokeSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Revoke Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* US-011: Usage Examples Modal */}
      {showUsageExamples && newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowUsageExamples(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Usage Examples</h2>
                <p className="text-sm text-slate-600 mt-1">Integrate your new API key into your application</p>
              </div>
              <button
                onClick={() => setShowUsageExamples(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* SDK Integration */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Using the SDK</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Install the SDK:</p>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">npm install nextmavens-js</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Initialize the client:</p>
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(`import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: '${newKey.secretKey || newKey.apiKey.public_key}',
  projectId: '${project.id}'
})`, 'sdk-example')}
                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        {copied === 'sdk-example' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{`import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: '${newKey.secretKey || newKey.apiKey.public_key}',
  projectId: '${project.id}'
})`}</code>
                      </pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Example query:</p>
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(`const { data, error } = await client
  .from('users')
  .select('*')
  .limit(10)`, 'sdk-query')}
                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        {copied === 'sdk-query' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{`const { data, error } = await client
  .from('users')
  .select('*')
  .limit(10)`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* REST API Integration */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Using REST API</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Example request:</p>
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(`curl -X GET "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: ${newKey.secretKey || newKey.apiKey.public_key}" \\
  -H "Authorization: Bearer ${newKey.secretKey || newKey.apiKey.public_key}"`, 'rest-example')}
                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        {copied === 'rest-example' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                      <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{`curl -X GET "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: ${newKey.secretKey || newKey.apiKey.public_key}" \\
  -H "Authorization: Bearer ${newKey.secretKey || newKey.apiKey.public_key}"`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment Variable */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Environment Variable</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-2">Add to your .env file:</p>
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(`NEXTMAVENS_API_KEY=${newKey.secretKey || newKey.apiKey.public_key}`, 'env-example')}
                      className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      {copied === 'env-example' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                    <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-sm text-slate-300 font-mono">NEXTMAVENS_API_KEY={newKey.secretKey || newKey.apiKey.public_key}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Key Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Key Type: {newKey.apiKey.key_type}</h4>
                    <p className="text-sm text-blue-800">
                      {KEY_TYPE_CONFIG[newKey.apiKey.key_type as keyof typeof KEY_TYPE_CONFIG]?.warning}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowUsageExamples(false)}
                className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* US-010: Deletion Preview Modal */}
      {project && (
        <DeletionPreviewModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          projectId={project.id}
          onConfirmDelete={handleDeleteProject}
        />
      )}
    </div>
  )
}
