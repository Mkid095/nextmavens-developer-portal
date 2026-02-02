/**
 * API Keys Tab - API Key List Component
 */

import type { ApiKey, NewKeyResponse, KeyUsageStats } from '../../../types'
import { isKeyInactive } from '../../../hooks'
import type { KeyDisplayState } from '../types'
import { KeyCard } from './KeyCard'

interface ApiKeyListProps {
  project: { id: string }
  apiKeys: ApiKey[]
  newKey: NewKeyResponse | null
  keyUsageStats: Record<string, KeyUsageStats>
  usageStatsLoading: Record<string, boolean>
  copied: string | null
  canManageKeys: boolean
  onCopy: (text: string, id: string) => void
  onOpenRotate: (keyId: string) => void
  onOpenRevoke: (keyId: string) => void
  onDeleteKey: (keyId: string) => void
  onToggleShowSecret: (keyId: string) => void
  showSecret: Record<string, boolean>
  showSecretState: KeyDisplayState['showSecretState']
}

export function ApiKeyList({
  project,
  apiKeys,
  newKey,
  keyUsageStats,
  usageStatsLoading,
  copied,
  canManageKeys,
  onCopy,
  onOpenRotate,
  onOpenRevoke,
  onDeleteKey,
  onToggleShowSecret,
  showSecret,
  showSecretState,
}: ApiKeyListProps) {
  return (
    <div className="space-y-4">
      {apiKeys.map((key) => {
        const isNewKey = newKey && newKey.apiKey.id === key.id
        const displayKey = isNewKey ? newKey.apiKey : key
        const hasFullKey = isNewKey || (key.public_key && key.public_key.length > 20)
        const usageStats = keyUsageStats[key.id]
        const loadingStats = usageStatsLoading[key.id]
        const inactive = isKeyInactive(key)

        return (
          <KeyCard
            key={key.id}
            project={project}
            key={key}
            displayKey={displayKey}
            isNewKey={isNewKey}
            hasFullKey={hasFullKey}
            usageStats={usageStats}
            loadingStats={loadingStats}
            inactive={inactive}
            copied={copied}
            showSecret={showSecret[key.id]}
            showSecretState={showSecretState}
            onToggleSecret={onToggleShowSecret}
            onCopy={onCopy}
            canManageKeys={canManageKeys}
            onOpenRotate={onOpenRotate}
            onOpenRevoke={onOpenRevoke}
            onDeleteKey={onDeleteKey}
          />
        )
      })}
    </div>
  )
}
