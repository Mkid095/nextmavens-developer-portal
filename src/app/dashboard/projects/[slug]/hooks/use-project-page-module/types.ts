/**
 * Project Page Hook - Module - Types
 */

import type { KeyType, McpAccessLevel, NewKeyResponse } from '../../types'

export type TabType =
  | 'overview'
  | 'database'
  | 'auth'
  | 'storage'
  | 'realtime'
  | 'graphql'
  | 'api-keys'
  | 'secrets'
  | 'mcp-analytics'
  | 'feature-flags'
  | 'support'

export interface CreateApiKeyData {
  name: string
  keyType: KeyType
  environment: 'live' | 'test' | 'dev'
  scopes: string[]
  mcpAccessLevel: McpAccessLevel
}

export interface ModalStates {
  showCreateKeyModal: boolean
  keySubmitting: boolean
  keyError: string
  showRotateModal: boolean
  rotateSubmitting: boolean
  showRevokeModal: boolean
  revokeSubmitting: boolean
  selectedKeyId: string | null
  newKey: NewKeyResponse | null
  showUsageExamples: boolean
  showDeleteModal: boolean
  deleteSubmitting: boolean
  showSupportModal: boolean
  selectedRequestId: string | null
  showDetailModal: boolean
  supportStatusFilter: string
  showSecret: Record<string, boolean>
}

export interface PermissionStates {
  canDeleteProject: boolean
  canManageServices: boolean
  canManageKeys: boolean
}

export interface UseProjectPageState extends ModalStates, PermissionStates {
  activeTab: TabType
  codeLanguage: string
  project: any
  projectLoading: boolean
  projectError: any
  apiKeys: any[]
  suspensionStatus: any
  keyUsageStats: any
  usageStatsLoading: boolean
  featureFlags: any
  flagsLoading: boolean
  flagsError: any
  supportRequests: any[]
  supportRequestsLoading: boolean
  supportRequestsError: any
  serviceStatuses: any[]
  updatingService: boolean
  copied: string | null
}

export interface UseProjectPageHandlers {
  handleToggleService: (service: string) => Promise<void>
  handleCopy: (text: string, id?: string) => void
  handleCreateApiKey: (data: CreateApiKeyData) => Promise<void>
  handleRotateKey: () => Promise<void>
  handleRevokeKey: () => Promise<void>
  handleDeleteApiKey: (keyId: string) => Promise<void>
  handleDeleteProject: () => Promise<void>
  openCreateKeyModal: () => void
  openRotateModal: (keyId: string) => void
  openRevokeModal: (keyId: string) => void
  handleViewRequestDetails: (requestId: string) => void
  onToggleFlag: (flag: string) => Promise<void>
  onRemoveFlag: (flag: string) => Promise<void>
  setSupportStatusFilter: (filter: string) => void
  setShowSecret: (secretId: string, show: boolean) => void
  fetchFeatureFlags: () => Promise<void>
  fetchSupportRequests: () => Promise<void>
}

export interface UseProjectPageReturn extends UseProjectPageState, UseProjectPageHandlers {
  setActiveTab: (tab: TabType) => void
  setCodeLanguage: (lang: string) => void
  setShowCreateKeyModal: (show: boolean) => void
  setShowRotateModal: (show: boolean) => void
  setShowRevokeModal: (show: boolean) => void
  setShowUsageExamples: (show: boolean) => void
  setShowDeleteModal: (show: boolean) => void
  setShowSupportModal: (show: boolean) => void
  setShowDetailModal: (show: boolean) => void
  setNewKey: (key: NewKeyResponse | null) => void
  setSelectedKeyId: (id: string | null) => void
  setSelectedRequestId: (id: string | null) => void
}
