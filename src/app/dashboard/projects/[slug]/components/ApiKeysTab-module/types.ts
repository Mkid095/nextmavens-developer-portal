/**
 * API Keys Tab - Type Definitions
 */

import type { ApiKey, NewKeyResponse, KeyUsageStats } from '../../types'

export interface ApiKeysTabProps {
  project: { id: string }
  apiKeys: ApiKey[]
  newKey: NewKeyResponse | null
  keyUsageStats: Record<string, KeyUsageStats>
  usageStatsLoading: Record<string, boolean>
  copied: string | null
  canManageKeys: boolean
  onCopy: (text: string, id: string) => void
  onCreateKey: () => void
  onOpenRotate: (keyId: string) => void
  onOpenRevoke: (keyId: string) => void
  onDeleteKey: (keyId: string) => void
  onToggleShowSecret: (keyId: string) => void
  showSecret: Record<string, boolean>
  onCloseNewKey: () => void
  onOpenUsageExamples: () => void
}

export interface KeyDisplayState {
  showSecretState: Record<string, boolean>
}

export interface KeyCardProps {
  project: { id: string }
  key: ApiKey
  displayKey: ApiKey | NewKeyResponse
  isNewKey: boolean
  hasFullKey: boolean
  usageStats?: KeyUsageStats
  loadingStats: boolean
  inactive: boolean
  copied: string | null
  showSecret: boolean
  showSecretState: Record<string, boolean>
  onToggleSecret: (keyId: string) => void
  onCopy: (text: string, id: string) => void
  canManageKeys: boolean
  onOpenRotate: (keyId: string) => void
  onOpenRevoke: (keyId: string) => void
  onDeleteKey: (keyId: string) => void
}
