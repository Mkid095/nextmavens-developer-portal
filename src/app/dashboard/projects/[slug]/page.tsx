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
  EyeOff as EyeOffIcon,
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
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle,
  LifeBuoy,
  Lock,
  Edit3,
} from 'lucide-react'
import SuspensionBanner from '@/components/SuspensionBanner'
import QuotaWarningBanner from '@/components/QuotaWarningBanner'
import ServiceTab from '@/components/ServiceTab'
import CreateApiKeyModal, { type CreateKeyData } from '@/components/CreateApiKeyModal'
import DeletionPreviewModal from '@/components/DeletionPreviewModal'
import CodeBlockEnhancer from '@/components/docs/CodeBlockEnhancer'
import SupportRequestModal from '@/components/SupportRequestModal'
import SupportRequestDetailModal from '@/components/SupportRequestDetailModal'
import { McpUsageAnalytics } from '@/components/McpUsageAnalytics'
import LanguageSelector, { type CodeLanguage, useLanguageSelector } from '@/components/LanguageSelector'
import MultiLanguageCodeBlock, { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import ServiceStatusIndicator, { type ServiceStatus } from '@/components/ServiceStatusIndicator'
import type { ServiceType } from '@/lib/types/service-status.types'
import type { ApiKeyType, ApiKeyEnvironment } from '@/lib/types/api-key.types'
import { usePermission, usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/types/rbac.types'

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
 * Service status tracking
 * US-010: Add Service Status Indicators
 */
interface ServiceStatuses {
  database: ServiceStatus
  auth: ServiceStatus
  storage: ServiceStatus
  realtime: ServiceStatus
  graphql: ServiceStatus
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

type Tab = 'overview' | 'database' | 'auth' | 'storage' | 'realtime' | 'graphql' | 'api-keys' | 'mcp-analytics' | 'feature-flags' | 'support'

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'auth', label: 'Auth', icon: Shield },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'realtime', label: 'Realtime', icon: Activity },
  { id: 'graphql', label: 'GraphQL', icon: Code2 },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'mcp-analytics', label: 'MCP Analytics', icon: BarChart3 },
  { id: 'feature-flags', label: 'Feature Flags', icon: ShieldAlert },
  { id: 'support', label: 'Support', icon: LifeBuoy },
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

/**
 * MCP token type configuration for US-010: Add MCP Token Indicators in UI
 */
interface McpTokenInfo {
  isMcp: boolean
  label: string
  bgColor: string
  textColor: string
  icon: LucideIcon
  showWarning: boolean
}

function getMcpTokenInfo(keyPrefix: string, keyType: string): McpTokenInfo {
  // Check if this is an MCP token
  if (keyType !== 'mcp' || !keyPrefix.startsWith('mcp_')) {
    return {
      isMcp: false,
      label: keyType,
      bgColor: 'bg-slate-200',
      textColor: 'text-slate-700',
      icon: Key,
      showWarning: false,
    }
  }

  // Extract MCP access level from prefix (mcp_ro_, mcp_rw_, mcp_admin_)
  const match = keyPrefix.match(/^mcp_(ro|rw|admin)_/)
  const accessLevel = match ? match[1] : 'ro'

  switch (accessLevel) {
    case 'ro':
      return {
        isMcp: true,
        label: 'MCP Read-Only',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: EyeOffIcon,
        showWarning: false,
      }
    case 'rw':
      return {
        isMcp: true,
        label: 'MCP Read-Write',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: Edit3,
        showWarning: true,
      }
    case 'admin':
      return {
        isMcp: true,
        label: 'MCP Admin',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: Lock,
        showWarning: true,
      }
    default:
      return {
        isMcp: true,
        label: 'MCP',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-700',
        icon: Server,
        showWarning: false,
      }
  }
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
  // US-010: Service status tracking
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatuses>({
    database: 'enabled',
    auth: 'enabled',
    storage: 'enabled',
    realtime: 'enabled',
    graphql: 'enabled',
  })
  const [updatingService, setUpdatingService] = useState<ServiceType | null>(null)
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
  // US-006: MCP governance - access level and warning modal
  const [mcpAccessLevel, setMcpAccessLevel] = useState<'ro' | 'rw' | 'admin'>('ro')
  const [showMcpWriteWarning, setShowMcpWriteWarning] = useState(false)
  const [mcpWriteConfirmed, setMcpWriteConfirmed] = useState(false)
  // US-010: Deletion preview modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  // US-004: Support request modal
  const [showSupportModal, setShowSupportModal] = useState(false)
  // US-006: Support requests list and detail modal
  const [supportRequests, setSupportRequests] = useState<any[]>([])
  const [supportRequestsLoading, setSupportRequestsLoading] = useState(false)
  const [supportRequestsError, setSupportRequestsError] = useState<string | null>(null)
  const [supportStatusFilter, setSupportStatusFilter] = useState<string>('all')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  // US-011: Feature Flags state
  const [featureFlags, setFeatureFlags] = useState<any[]>([])
  const [flagsLoading, setFlagsLoading] = useState(false)
  const [flagsError, setFlagsError] = useState<string | null>(null)
  const [updatingFlag, setUpdatingFlag] = useState<string | null>(null)
  // US-009: Language selector for code examples
  const [codeLanguage, setCodeLanguage] = useLanguageSelector()

  // US-009: Permission checks for UI elements
  // Note: tenant_id is the organization_id for permission checks
  const { canPerform: canDeleteProject, isLoading: deletePermLoading } = usePermission(
    Permission.PROJECTS_DELETE,
    project?.tenant_id || null,
    { enabled: !!project?.tenant_id }
  )
  const { canPerform: canManageServices, isLoading: manageServicesPermLoading } = usePermission(
    Permission.PROJECTS_MANAGE_SERVICES,
    project?.tenant_id || null,
    { enabled: !!project?.tenant_id }
  )
  const { canPerform: canManageKeys, isLoading: manageKeysPermLoading } = usePermission(
    Permission.PROJECTS_MANAGE_KEYS,
    project?.tenant_id || null,
    { enabled: !!project?.tenant_id }
  )
  const { canPerform: canManageUsers, isLoading: manageUsersPermLoading } = usePermission(
    Permission.PROJECTS_MANAGE_USERS,
    project?.tenant_id || null,
    { enabled: !!project?.tenant_id }
  )

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

  // US-011: Fetch feature flags when tab changes to feature-flags
  useEffect(() => {
    if (activeTab === 'feature-flags') {
      fetchFeatureFlags()
    }
  }, [activeTab, project?.id])

  // US-006: Fetch support requests when tab changes to support or filter changes
  useEffect(() => {
    if (activeTab === 'support') {
      fetchSupportRequests()
    }
  }, [activeTab, supportStatusFilter, project?.id])

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

  // US-011: Fetch project feature flags
  const fetchFeatureFlags = async () => {
    if (!project?.id) return

    setFlagsLoading(true)
    setFlagsError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project.id}/feature-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFeatureFlags(data.flags || [])
      } else {
        const errorData = await res.json()
        setFlagsError(errorData.error || 'Failed to fetch feature flags')
      }
    } catch (err) {
      console.error('Failed to fetch feature flags:', err)
      setFlagsError('Failed to fetch feature flags')
    } finally {
      setFlagsLoading(false)
    }
  }

  // US-006: Fetch support requests
  const fetchSupportRequests = async () => {
    if (!project?.id) return

    setSupportRequestsLoading(true)
    setSupportRequestsError(null)
    try {
      const token = localStorage.getItem('accessToken')
      const statusParam = supportStatusFilter !== 'all' ? `&status=${supportStatusFilter}` : ''
      const res = await fetch(`/api/support/requests?project_id=${project.id}${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSupportRequests(data.requests || [])
      } else {
        const errorData = await res.json()
        setSupportRequestsError(errorData.error || 'Failed to fetch support requests')
      }
    } catch (err) {
      console.error('Failed to fetch support requests:', err)
      setSupportRequestsError('Failed to fetch support requests')
    } finally {
      setSupportRequestsLoading(false)
    }
  }

  // US-006: Handle clicking on a support request to view details
  const handleViewRequestDetails = (requestId: string) => {
    setSelectedRequestId(requestId)
    setShowDetailModal(true)
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
    // US-006: Reset MCP governance state
    setMcpAccessLevel('ro')
    setShowMcpWriteWarning(false)
    setMcpWriteConfirmed(false)
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

    // US-006: Check if MCP token with write/admin access - show warning modal
    if (selectedKeyType === 'mcp' && (mcpAccessLevel === 'rw' || mcpAccessLevel === 'admin')) {
      if (!showMcpWriteWarning) {
        setShowMcpWriteWarning(true)
        return
      }
      if (!mcpWriteConfirmed) {
        setKeyError('Please confirm that you understand the risks of granting write access')
        return
      }
    }

    setKeySubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      // US-006: Prepare request body with mcp_access_level for MCP tokens
      const requestBody: any = {
        name: newKeyName.trim(),
        key_type: selectedKeyType,
        environment: newKeyEnvironment,
        scopes: selectedScopes,
      }

      // Add mcp_access_level for MCP tokens
      if (selectedKeyType === 'mcp') {
        requestBody.mcp_access_level = mcpAccessLevel
      }

      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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

  // US-011: Handle feature flag toggle
  const handleToggleFeatureFlag = async (flagName: string, currentEnabled: boolean) => {
    if (!project?.id) return

    setUpdatingFlag(flagName)
    setFlagsError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project.id}/feature-flags/${flagName}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: !currentEnabled,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update feature flag')
      }

      // Refresh feature flags
      fetchFeatureFlags()
    } catch (err: any) {
      console.error('Failed to toggle feature flag:', err)
      setFlagsError(err.message || 'Failed to update feature flag')
    } finally {
      setUpdatingFlag(null)
    }
  }

  // US-011: Handle remove project-specific flag (revert to global)
  const handleRemoveProjectFlag = async (flagName: string) => {
    if (!project?.id) return

    if (!confirm(`Remove project-specific setting for "${flagName}" and use the global default?`)) {
      return
    }

    setUpdatingFlag(flagName)
    setFlagsError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project.id}/feature-flags/${flagName}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove feature flag')
      }

      // Refresh feature flags
      fetchFeatureFlags()
    } catch (err: any) {
      console.error('Failed to remove feature flag:', err)
      setFlagsError(err.message || 'Failed to remove feature flag')
    } finally {
      setUpdatingFlag(null)
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

  // US-010: Handle service status toggle
  const handleToggleService = async (service: ServiceType, newStatus: ServiceStatus) => {
    if (!project?.id || updatingService) return

    const currentStatus = serviceStatuses[service]

    // Confirm before disabling
    if (newStatus === 'disabled') {
      const confirmed = confirm(`Are you sure you want to disable the ${service} service? This may affect your application.`)
      if (!confirmed) return
    }

    setUpdatingService(service)
    try {
      // Simulate provisioning state when enabling
      if (newStatus === 'enabled') {
        setServiceStatuses(prev => ({
          ...prev,
          [service]: 'provisioning',
        }))

        // Simulate provisioning delay (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      setServiceStatuses(prev => ({
        ...prev,
        [service]: newStatus,
      }))
    } catch (err: any) {
      console.error(`Failed to toggle ${service} service:`, err)
      alert(err.message || `Failed to ${newStatus === 'enabled' ? 'enable' : 'disable'} ${service} service`)
    } finally {
      setUpdatingService(null)
    }
  }

  // US-010: Create toggle handler for a specific service
  const createToggleHandler = (service: ServiceType) => {
    return async () => {
      const currentStatus = serviceStatuses[service]
      const newStatus: ServiceStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled'
      await handleToggleService(service, newStatus)
    }
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
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              title="Request Support"
            >
              <LifeBuoy className="w-4 h-4" />
              <span className="text-sm font-medium">Support</span>
            </button>
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
          {tabs.map((tab) => {
            // Check if this tab has a service status
            const isServiceTab = ['database', 'auth', 'storage', 'realtime', 'graphql'].includes(tab.id)
            const serviceStatus = isServiceTab ? serviceStatuses[tab.id as keyof ServiceStatuses] : null

            return (
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
                {/* US-010: Service Status Indicator */}
                {isServiceTab && serviceStatus && (
                  <ServiceStatusIndicator
                    service={tab.id as ServiceType}
                    status={serviceStatus}
                    onToggle={handleToggleService}
                    isUpdating={updatingService === tab.id}
                  />
                )}
              </button>
            )
          })}
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

              {/* US-009: Delete Project Section - Only shown to owners */}
              {canDeleteProject && (
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
              )}
            </div>
          )}

          {activeTab === 'database' && (
            <>
              {/* US-009: Language Selector for Code Examples */}
              {/* US-010: Service Status Indicator */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">Database Service</h2>
                  <ServiceStatusIndicator
                    service="database"
                    status={serviceStatuses.database}
                    onToggle={createToggleHandler('database')}
                    isUpdating={updatingService === 'database'}
                  />
                </div>
                <LanguageSelector value={codeLanguage} onChange={setCodeLanguage} />
              </div>

              <ServiceTab
                serviceName="Database"
                overview="A powerful PostgreSQL-powered data service with auto-generated REST & GraphQL APIs. Store, query, and manage your application data with full SQL capabilities while enjoying the convenience of instant API generation."
                whenToUse="Use the Database service for any application that needs persistent data storage - user profiles, content management, e-commerce catalogs, analytics data, or any structured data. Perfect for applications requiring complex queries, transactions, and relational data modeling."
                quickStart={
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: 'npm install nextmavens-js',
                          python: 'pip install nextmavens-py',
                          go: 'go get github.com/nextmavens/go-sdk',
                          curl: '# No installation needed - cURL comes with most systems',
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project?.id || 'YOUR_PROJECT_ID'}'
})`,
                          python: `import nextmavens

client = nextmavens.create_client(
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project?.id || 'YOUR_PROJECT_ID'}'
)`,
                          go: `package main

import "github.com/nextmavens/go-sdk"

func main() {
    client := nextmavens.NewClient(nextmavens.Config{
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project?.id || 'YOUR_PROJECT_ID'}",
    })
}`,
                          curl: `# Set your API key and project ID as environment variables
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project?.id || 'YOUR_PROJECT_ID'}"`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Query Example</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `// Query data
const { data, error } = await client
  .from('users')
  .select('*')
  .limit(10)

// Insert data
const { data } = await client
  .from('users')
  .insert({ email: 'user@example.com' })`,
                          python: `# Query data
response = client.table('users').select('*').limit(10).execute()

# Insert data
response = client.table('users').insert({
    'email': 'user@example.com'
}).execute()`,
                          go: `// Query data
data, err := client.From("users").Select("*").Limit(10).Execute()

// Insert data
data, err := client.From("users").Insert(map[string]interface{}{
    "email": "user@example.com",
}).Execute()`,
                          curl: `# Query data
curl -X GET "${endpoints.rest}/rest/v1/users?limit=10" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Authorization: Bearer $NEXTMAVENS_API_KEY"

# Insert data
curl -X POST "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Authorization: Bearer $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com"}'`,
                        })}
                      />
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
                {/* US-009: Create Key button - only shown to admins and owners */}
                {canManageKeys && (
                  <button
                    onClick={openCreateKeyModal}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Create Key</span>
                  </button>
                )}
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
                      <p className="text-sm text-emerald-700">Copy these keys now. You won&apos;t see the secret key again.</p>
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
                            {(() => {
                              const mcpInfo = getMcpTokenInfo(displayKey.key_prefix, displayKey.key_type)
                              return (
                                <>
                                  <span className={`px-2 py-0.5 ${mcpInfo.bgColor} ${mcpInfo.textColor} text-xs rounded-full flex items-center gap-1`}>
                                    <mcpInfo.icon className="w-3 h-3" />
                                    {mcpInfo.label}
                                  </span>
                                  {mcpInfo.showWarning && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1" title="This token can modify your data">
                                      <AlertCircle className="w-3 h-3" />
                                      Write Access
                                    </span>
                                  )}
                                </>
                              )
                            })()}
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

              {/* US-011: MCP Usage Analytics Section */}
              {apiKeys.some((key) => key.key_type === 'mcp') && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <McpUsageAnalytics projectId={project.id} />
                </div>
              )}
            </div>
          )}

          {/* US-006: Support Requests Tab */}
          {activeTab === 'support' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Support Requests</h2>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">New Request</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="mb-6 flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">Filter by status:</span>
                <div className="flex gap-2">
                  {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSupportStatusFilter(status)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        supportStatusFilter === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Support Requests List */}
              {supportRequestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : supportRequestsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{supportRequestsError}</span>
                </div>
              ) : supportRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                  <LifeBuoy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No support requests</h3>
                  <p className="text-slate-600 mb-4">
                    {supportStatusFilter === 'all'
                      ? "You haven't created any support requests yet."
                      : `No ${supportStatusFilter} requests found.`}
                  </p>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Create Your First Request
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Resolved</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {supportRequests.map((request) => {
                        const statusConfig: Record<string, { label: string; color: string }> = {
                          open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
                          in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
                          resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800' },
                          closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800' },
                        }
                        const status = statusConfig[request.status] || statusConfig.open
                        return (
                          <tr key={request.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-900">{request.subject}</div>
                              <div className="text-xs text-slate-500 truncate max-w-xs">{request.description}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(request.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {request.resolved_at ? new Date(request.resolved_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleViewRequestDetails(request.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'graphql' && (
            <>
              {/* US-009: Language Selector for Code Examples */}
              {/* US-010: Service Status Indicator */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">GraphQL Service</h2>
                  <ServiceStatusIndicator
                    service="graphql"
                    status={serviceStatuses.graphql}
                    onToggle={createToggleHandler('graphql')}
                    isUpdating={updatingService === 'graphql'}
                  />
                </div>
                <LanguageSelector value={codeLanguage} onChange={setCodeLanguage} />
              </div>

              <ServiceTab
                serviceName="GraphQL"
                overview="A powerful GraphQL API automatically generated from your database schema. Query your data with flexible, type-safe GraphQL operations. No manual API development required - the schema reflects your database structure in real-time."
                whenToUse="Use the GraphQL service when you need flexible, efficient data fetching. Perfect for frontend applications, mobile apps, and any scenario where clients need to query exactly the data they need. Ideal for complex data relationships, nested queries, and avoiding over-fetching."
                quickStart={
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: 'npm install @nextmavens/graphql',
                          python: 'pip install nextmavens-graphql',
                          go: 'go get github.com/nextmavens/go-graphql',
                          curl: '# No installation needed - use curl directly',
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `import { createGraphQLClient } from '@nextmavens/graphql'

const graphql = createGraphQLClient({
  url: '${endpoints.graphql}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project?.id || 'YOUR_PROJECT_ID'}'
})`,
                          python: `import nextmavens_graphql

graphql = nextmavens_graphql.create_client(
    url='${endpoints.graphql}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project?.id || 'YOUR_PROJECT_ID'}'
)`,
                          go: `package main

import "github.com/nextmavens/go-graphql"

func main() {
    graphql := gographql.NewClient(gographql.Config{
        URL: "${endpoints.graphql}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project?.id || 'YOUR_PROJECT_ID'}",
    })
}`,
                          curl: `# Set your API key and project ID as environment variables
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project?.id || 'YOUR_PROJECT_ID'}"
export GRAPHQL_URL="${endpoints.graphql}"`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Query Example</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `const { data, error } = await graphql.query(\`query {
  users(limit: 10, order_by: { created_at: desc }) {
    id
    email
    created_at
    profiles {
      full_name
      avatar_url
    }
  }
}\`)`,
                          python: `query = \"""
query {
  users(limit: 10, order_by: { created_at: desc }) {
    id
    email
    created_at
    profiles {
      full_name
      avatar_url
    }
  }
}
\"""

result = graphql.query(query)`,
                          go: `query := \`query {
  users(limit: 10, order_by: { created_at: desc }) {
    id
    email
    created_at
    profiles {
      full_name
      avatar_url
    }
  }
}\`

result, err := graphql.Query(query)`,
                          curl: `curl -X POST "$GRAPHQL_URL/graphql" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "query { users(limit: 10) { id email } }"
  }'`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Mutation Example</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `const { data, error } = await graphql.mutation(\`mutation {
  insert_users_one(object: {
    email: "user@example.com"
    profiles: {
      data: { full_name: "John Doe" }
    }
  }) {
    id
    email
  }
}\`)`,
                          python: `mutation = \"""
mutation {
  insert_users_one(object: {
    email: "user@example.com"
    profiles: {
      data: { full_name: "John Doe" }
    }
  }) {
    id
    email
  }
}
\"""

result = graphql.mutate(mutation)`,
                          go: `mutation := \`mutation {
  insert_users_one(object: {
    email: "user@example.com"
    profiles: {
      data: { full_name: "John Doe" }
    }
  }) {
    id
    email
  }
}\`

result, err := graphql.Mutate(mutation)`,
                          curl: `curl -X POST "$GRAPHQL_URL/graphql" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "mutation { insert_users_one(object: { email: \\"user@example.com\\" }) { id email } }"
  }'`,
                        })}
                      />
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
            <>
              {/* US-009: Language Selector for Code Examples */}
              {/* US-010: Service Status Indicator */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">Auth Service</h2>
                  <ServiceStatusIndicator
                    service="auth"
                    status={serviceStatuses.auth}
                    onToggle={createToggleHandler('auth')}
                    isUpdating={updatingService === 'auth'}
                  />
                </div>
                <LanguageSelector value={codeLanguage} onChange={setCodeLanguage} />
              </div>

              <ServiceTab
                serviceName="Auth"
                overview="A complete authentication service that handles user registration, login, session management, and JWT token generation. Built-in security features including password hashing, token refresh, and session management."
                whenToUse="Use the Auth service whenever your application needs user authentication and authorization. Perfect for user accounts, admin panels, API authentication, and any scenario requiring secure access control. Supports email/password authentication with plans for social providers (OAuth)."
                quickStart={
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: 'npm install @nextmavens/auth',
                          python: 'pip install nextmavens-auth',
                          go: 'go get github.com/nextmavens/go-auth',
                          curl: '# No installation needed - use cURL directly',
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `import { createAuthClient } from '@nextmavens/auth'

const auth = createAuthClient({
  url: '${endpoints.auth}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project?.id || 'YOUR_PROJECT_ID'}'
})`,
                          python: `import nextmavens_auth

auth = nextmavens_auth.create_client(
    url='${endpoints.auth}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project?.id || 'YOUR_PROJECT_ID'}'
)`,
                          go: `package main

import "github.com/nextmavens/go-auth"

func main() {
    auth := goauth.NewClient(goauth.Config{
        URL: "${endpoints.auth}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project?.id || 'YOUR_PROJECT_ID'}",
    })
}`,
                          curl: `# Set your API key and project ID as environment variables
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project?.id || 'YOUR_PROJECT_ID'}"
export AUTH_URL="${endpoints.auth}"`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Sign Up Example</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `const { user, error } = await auth.signUp({
  email: 'user@example.com',
  password: 'secure_password'
})`,
                          python: `response = auth.sign_up(
    email='user@example.com',
    password='secure_password'
)`,
                          go: `user, err := auth.SignUp(goauth.SignUpRequest{
    Email:    "user@example.com",
    Password: "secure_password",
})`,
                          curl: `curl -X POST "$AUTH_URL/v1/auth/signup" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "secure_password"}'`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Sign In Example</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `const { session, error } = await auth.signIn({
  email: 'user@example.com',
  password: 'secure_password'
})`,
                          python: `response = auth.sign_in(
    email='user@example.com',
    password='secure_password'
)`,
                          go: `session, err := auth.SignIn(goauth.SignInRequest{
    Email:    "user@example.com",
    Password: "secure_password",
})`,
                          curl: `curl -X POST "$AUTH_URL/v1/auth/signin" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "secure_password"}'`,
                        })}
                      />
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
            <>
              {/* US-009: Language Selector for Code Examples */}
              {/* US-010: Service Status Indicator */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">Storage Service</h2>
                  <ServiceStatusIndicator
                    service="storage"
                    status={serviceStatuses.storage}
                    onToggle={createToggleHandler('storage')}
                    isUpdating={updatingService === 'storage'}
                  />
                </div>
                <LanguageSelector value={codeLanguage} onChange={setCodeLanguage} />
              </div>

              <ServiceTab
                serviceName="Storage"
                overview="A transparent storage abstraction that automatically routes files to optimal backends. Raw files go to Telegram for permanent storage, while web-optimized assets are served through Cloudinary CDN. Zero configuration needed - just upload and we handle the rest."
                whenToUse="Use the Storage service for all file handling needs - user uploads, images, videos, documents, backups, and static assets. Perfect for profile pictures, document management, media galleries, and any application requiring file storage with automatic optimization and CDN delivery."
                quickStart={
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: 'npm install @nextmavens/storage',
                          python: 'pip install nextmavens-storage',
                          go: 'go get github.com/nextmavens/go-storage',
                          curl: '# No installation needed - use cURL directly',
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `import { createStorageClient } from '@nextmavens/storage'

const storage = createStorageClient({
  url: '${endpoints.storage}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project?.id || 'YOUR_PROJECT_ID'}'
})`,
                          python: `import nextmavens_storage

storage = nextmavens_storage.create_client(
    url='${endpoints.storage}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project?.id || 'YOUR_PROJECT_ID'}'
)`,
                          go: `package main

import "github.com/nextmavens/go-storage"

func main() {
    storage := gostorage.NewClient(gostorage.Config{
        URL: "${endpoints.storage}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project?.id || 'YOUR_PROJECT_ID'}",
    })
}`,
                          curl: `# Set your API key and project ID as environment variables
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project?.id || 'YOUR_PROJECT_ID'}"
export STORAGE_URL="${endpoints.storage}"`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Upload File Example</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `const file = document.querySelector('input[type="file"]').files[0]

const { data, error } = await storage.upload({
  file: file,
  bucket: 'uploads',
  path: \`avatars/\${Date.now()}_\${file.name}\`
})`,
                          python: `# Upload file
with open('avatar.jpg', 'rb') as f:
    response = storage.upload(
        file=f,
        bucket='uploads',
        path='avatars/avatar.jpg'
    )`,
                          go: `file, err := os.Open("avatar.jpg")
if err != nil {
    log.Fatal(err)
}
defer file.Close()

result, err := storage.Upload(gostorage.UploadRequest{
    File:   file,
    Bucket: "uploads",
    Path:   "avatars/avatar.jpg",
})`,
                          curl: `# Upload file using cURL
curl -X POST "$STORAGE_URL/v1/storage/upload" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -F "file=@avatar.jpg" \\
  -F "bucket=uploads" \\
  -F "path=avatars/avatar.jpg"`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Get Public URL Example</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `const { publicUrl } = storage.getPublicUrl({
  bucket: 'uploads',
  path: 'avatars/1234567890_profile.jpg'
})

// <img src={publicUrl} alt="Profile" />`,
                          python: `# Get public URL
public_url = storage.get_public_url(
    bucket='uploads',
    path='avatars/1234567890_profile.jpg'
)

# <img src="{{ public_url }}" alt="Profile" />`,
                          go: `// Get public URL
publicURL := storage.GetPublicURL(gostorage.PublicURLRequest{
    Bucket: "uploads",
    Path:   "avatars/1234567890_profile.jpg",
})

// <img src="{{ publicURL }}" alt="Profile" />`,
                          curl: `# Get public URL (construct it manually)
echo "https://cdn.nextmavens.cloud/$PROJECT_ID/uploads/avatars/1234567890_profile.jpg"`,
                        })}
                      />
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
            <>
              {/* US-009: Language Selector for Code Examples */}
              {/* US-010: Service Status Indicator */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">Realtime Service</h2>
                  <ServiceStatusIndicator
                    service="realtime"
                    status={serviceStatuses.realtime}
                    onToggle={createToggleHandler('realtime')}
                    isUpdating={updatingService === 'realtime'}
                  />
                </div>
                <LanguageSelector value={codeLanguage} onChange={setCodeLanguage} />
              </div>

              <ServiceTab
                serviceName="Realtime"
                overview="A real-time data synchronization service powered by PostgreSQL Change Data Capture (CDC). Subscribe to database changes and receive instant updates via WebSocket connections. Perfect for collaborative apps, live dashboards, and multi-user experiences."
                whenToUse="Use the Realtime service when you need live data updates in your application. Ideal for collaborative editing, live dashboards, chat applications, notifications, activity feeds, and any scenario where users need to see changes instantly across multiple clients."
                quickStart={
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: 'npm install @nextmavens/realtime',
                          python: 'pip install nextmavens-realtime',
                          go: 'go get github.com/nextmavens/go-realtime',
                          curl: '# No installation needed - use websocat or wscat',
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `import { createRealtimeClient } from '@nextmavens/realtime'

const realtime = createRealtimeClient({
  url: '${endpoints.realtime}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project?.id || 'YOUR_PROJECT_ID'}'
})`,
                          python: `import nextmavens_realtime

realtime = nextmavens_realtime.create_client(
    url='${endpoints.realtime}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project?.id || 'YOUR_PROJECT_ID'}'
)`,
                          go: `package main

import "github.com/nextmavens/go-realtime"

func main() {
    realtime := gorealtime.NewClient(gorealtime.Config{
        URL: "${endpoints.realtime}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project?.id || 'YOUR_PROJECT_ID'}",
    })
}`,
                          curl: `# Set your API key and project ID as environment variables
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project?.id || 'YOUR_PROJECT_ID'}"
export REALTIME_URL="${endpoints.realtime}"`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Connect to WebSocket</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `// Connect to the realtime service
const { socket, error } = await realtime.connect()

// Handle connection events
socket.on('connected', () => {
  console.log('Connected to realtime!')
})

socket.on('disconnected', () => {
  console.log('Disconnected from realtime')
})`,
                          python: `# Connect to the realtime service
socket = await realtime.connect()

# Handle connection events
@socket.on('connected')
def on_connected():
    print('Connected to realtime!')

@socket.on('disconnected')
def on_disconnected():
    print('Disconnected from realtime')`,
                          go: `// Connect to the realtime service
socket, err := realtime.Connect()
if err != nil {
    log.Fatal(err)
}

// Handle connection events
socket.On("connected", func() {
    fmt.Println("Connected to realtime!")
})

socket.On("disconnected", func() {
    fmt.Println("Disconnected from realtime")
})`,
                          curl: `# Connect using websocat or wscat
# First, get a JWT token from the auth endpoint
TOKEN=$(curl -s -X POST "$REALTIME_URL/v1/auth/token" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": "'"$PROJECT_ID"'"}' | jq -r '.token')

# Then connect to WebSocket
wscat -c "$REALTIME_URL/v1/realtime?token=$TOKEN"`,
                        })}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Subscribe to Table Changes</h4>
                      <MultiLanguageCodeBlock
                        selectedLanguage={codeLanguage}
                        examples={createCodeExamples({
                          javascript: `// Subscribe to all changes on the 'users' table
const subscription = socket
  .channel('users')
  .on('INSERT', (payload) => {
    console.log('New user:', payload.new)
  })
  .on('UPDATE', (payload) => {
    console.log('User updated:', payload.new)
  })
  .subscribe()`,
                          python: `# Subscribe to all changes on the 'users' table
@socket.channel('users')
def on_insert(payload):
    print(f'New user: {payload["new"]}')

@socket.channel('users')
def on_update(payload):
    print(f'User updated: {payload["new"]}')

subscription = socket.subscribe('users')`,
                          go: `// Subscribe to all changes on the 'users' table
subscription := socket.Channel("users").
    On("INSERT", func(payload map[string]interface{}) {
        fmt.Println("New user:", payload["new"])
    }).
    On("UPDATE", func(payload map[string]interface{}) {
        fmt.Println("User updated:", payload["new"])
    }).
    Subscribe()`,
                          curl: `# Subscribe to table changes (send JSON message via WebSocket)
echo '{"event": "phx_join", "topic": "users", "payload": {"events": ["INSERT", "UPDATE"]}}' | \\
  wscat -c "$REALTIME_URL/v1/realtime?token=$TOKEN"`,
                        })}
                      />
                    </div>
                  </div>
                }
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

              {/* US-006: MCP Access Level Selector - shown only for MCP tokens */}
              {selectedKeyType === 'mcp' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    MCP Access Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMcpAccessLevel('ro')
                        setSelectedScopes(['db:select', 'storage:read', 'realtime:subscribe'])
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        mcpAccessLevel === 'ro'
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="w-4 h-4 text-teal-600" />
                        <h4 className="font-semibold text-slate-900 text-sm">Read-Only</h4>
                      </div>
                      <p className="text-xs text-slate-600">Safe for AI assistants</p>
                      <p className="text-xs text-slate-500 mt-1">db:select, storage:read</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMcpAccessLevel('rw')
                        setSelectedScopes(['db:select', 'db:insert', 'db:update', 'storage:read', 'storage:write', 'realtime:subscribe', 'graphql:execute'])
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        mcpAccessLevel === 'rw'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw className="w-4 h-4 text-amber-600" />
                        <h4 className="font-semibold text-slate-900 text-sm">Read-Write</h4>
                      </div>
                      <p className="text-xs text-slate-600">Can modify data</p>
                      <p className="text-xs text-slate-500 mt-1">+ insert, update, write</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMcpAccessLevel('admin')
                        setSelectedScopes(['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'realtime:subscribe', 'realtime:publish', 'graphql:execute', 'auth:manage'])
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        mcpAccessLevel === 'admin'
                          ? 'border-red-500 bg-red-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <h4 className="font-semibold text-slate-900 text-sm">Admin</h4>
                      </div>
                      <p className="text-xs text-slate-600">Full access</p>
                      <p className="text-xs text-slate-500 mt-1">+ delete, auth, publish</p>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {mcpAccessLevel === 'ro' && 'Read-only access - safe for most AI assistants'}
                    {mcpAccessLevel === 'rw' && 'Read-write access - AI can modify your data'}
                    {mcpAccessLevel === 'admin' && 'Admin access - AI has full control including deletion'}
                  </p>
                </div>
              )}

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

              {/* US-006: Warning for MCP tokens with write access */}
              {selectedKeyType === 'mcp' && (mcpAccessLevel === 'rw' || mcpAccessLevel === 'admin') && (
                <div className={`mb-6 p-4 border rounded-lg ${
                  mcpAccessLevel === 'admin'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      mcpAccessLevel === 'admin' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        mcpAccessLevel === 'admin' ? 'text-red-900' : 'text-amber-900'
                      }`}>
                        {mcpAccessLevel === 'admin' ? 'Admin MCP Token Warning' : 'Write Access Warning'}
                      </h4>
                      <p className={`text-sm ${
                        mcpAccessLevel === 'admin' ? 'text-red-800' : 'text-amber-800'
                      }`}>
                        {mcpAccessLevel === 'admin'
                          ? 'This AI has full administrative access including deletion and user management. Only grant to trusted AI ops tools in secure environments.'
                          : 'This AI can modify your data. Only grant to trusted systems.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* US-006: Info for MCP read-only tokens */}
              {selectedKeyType === 'mcp' && mcpAccessLevel === 'ro' && (
                <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-teal-900 mb-1">Read-Only MCP Token</h4>
                      <p className="text-sm text-teal-800">
                        This token has read-only access and is safe for AI assistants and code generation tools.
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

      {/* US-006: MCP Write Access Warning Modal */}
      {showMcpWriteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMcpWriteWarning(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {mcpAccessLevel === 'admin' ? 'Admin MCP Token' : 'Write Access Confirmation'}
              </h2>
              <button
                onClick={() => setShowMcpWriteWarning(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="mb-6">
              <div className={`p-4 border rounded-lg mb-4 ${
                mcpAccessLevel === 'admin'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    mcpAccessLevel === 'admin' ? 'text-red-600' : 'text-amber-600'
                  }`} />
                  <div>
                    <h3 className={`font-semibold mb-2 ${
                      mcpAccessLevel === 'admin' ? 'text-red-900' : 'text-amber-900'
                    }`}>
                      {mcpAccessLevel === 'admin'
                        ? 'This AI has full administrative access'
                        : 'This AI can modify your data'}
                    </h3>
                    <p className={`text-sm mb-2 ${
                      mcpAccessLevel === 'admin' ? 'text-red-800' : 'text-amber-800'
                    }`}>
                      {mcpAccessLevel === 'admin'
                        ? 'You are creating an admin MCP token. This AI will have full access including:'
                        : 'You are granting write access to an AI tool. This AI will be able to:'}
                    </p>
                    <ul className={`text-sm list-disc list-inside ${
                      mcpAccessLevel === 'admin' ? 'text-red-800' : 'text-amber-800'
                    }`}>
                      {mcpAccessLevel === 'admin' ? (
                        <>
                          <li>Delete any data in your database</li>
                          <li>Manage users and authentication</li>
                          <li>Modify any settings</li>
                          <li>Access all services</li>
                        </>
                      ) : (
                        <>
                          <li>Insert and update database records</li>
                          <li>Upload and modify storage files</li>
                          <li>Execute GraphQL mutations</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 mb-3">
                  Only grant this access to <strong>trusted AI systems</strong> in <strong>secure environments</strong>.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mcpWriteConfirmed}
                    onChange={(e) => setMcpWriteConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <span className="text-sm text-slate-700">
                    I understand the risks and only grant this access to trusted systems
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMcpWriteWarning(false)
                  setMcpWriteConfirmed(false)
                }}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mcpWriteConfirmed) {
                    setShowMcpWriteWarning(false)
                    // Proceed with key creation by calling handleCreateApiKey again
                    handleCreateApiKey({ preventDefault: () => {} } as React.FormEvent)
                  }
                }}
                disabled={!mcpWriteConfirmed}
                className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Create
              </button>
            </div>
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

      {/* US-004: Support Request Modal */}
      {project && (
        <SupportRequestModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          projectId={project.id}
          projectName={project.name}
        />
      )}

      {/* US-006: Support Request Detail Modal */}
      {selectedRequestId && (
        <SupportRequestDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          requestId={selectedRequestId}
        />
      )}
    </div>
    </>
  )
}
