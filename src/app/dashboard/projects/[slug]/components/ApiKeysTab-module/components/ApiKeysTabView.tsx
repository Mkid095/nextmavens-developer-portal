/**
 * API Keys Tab - Main View Component
 */

import { useState } from 'react'
import { McpUsageAnalytics } from '@/components/McpUsageAnalytics'
import type { ApiKey, NewKeyResponse, KeyUsageStats } from '../../types'
import type { ApiKeysTabProps, KeyDisplayState } from '../types'
import { Header } from './Header'
import { KeyTypesInfo } from './KeyTypesInfo'
import { SecurityWarning } from './SecurityWarning'
import { QuickIntegration } from './QuickIntegration'
import { NewKeyDisplay } from './NewKeyDisplay'
import { EmptyState } from './EmptyState'
import { ApiKeyList } from './ApiKeyList'

export function ApiKeysTabView({
  project,
  apiKeys,
  newKey,
  keyUsageStats,
  usageStatsLoading,
  copied,
  canManageKeys,
  onCopy,
  onCreateKey,
  onOpenRotate,
  onOpenRevoke,
  onDeleteKey,
  onToggleShowSecret,
  showSecret,
  onCloseNewKey,
  onOpenUsageExamples,
}: ApiKeysTabProps) {
  const [showSecretState, setShowSecretState] = useState<KeyDisplayState['showSecretState']>({})

  const handleToggleSecret = (keyId: string) => {
    setShowSecretState((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
    onToggleShowSecret(keyId)
  }

  return (
    <div>
      <Header canManageKeys={canManageKeys} onCreateKey={onCreateKey} />

      {/* US-007: API Keys guidance section */}
      <div className="mb-6 space-y-4">
        <KeyTypesInfo />
        <SecurityWarning />
        <QuickIntegration project={project} copied={copied} onCopy={onCopy} />
      </div>

      {newKey && (
        <NewKeyDisplay
          newKey={newKey}
          copied={copied}
          onCopy={onCopy}
          onCloseNewKey={onCloseNewKey}
          onOpenUsageExamples={onOpenUsageExamples}
        />
      )}

      {apiKeys.length === 0 ? (
        <EmptyState canManageKeys={canManageKeys} onCreateKey={onCreateKey} />
      ) : (
        <ApiKeyList
          project={project}
          apiKeys={apiKeys}
          newKey={newKey}
          keyUsageStats={keyUsageStats}
          usageStatsLoading={usageStatsLoading}
          copied={copied}
          canManageKeys={canManageKeys}
          onCopy={onCopy}
          onOpenRotate={onOpenRotate}
          onOpenRevoke={onOpenRevoke}
          onDeleteKey={onDeleteKey}
          onToggleShowSecret={handleToggleSecret}
          showSecret={showSecret}
          showSecretState={showSecretState}
        />
      )}

      {/* US-011: MCP Usage Analytics Section */}
      {apiKeys.some((key) => key.key_type === 'mcp') && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <McpUsageAnalytics projectId={project.id} />
        </div>
      )}
    </div>
  )
}
