/**
 * Modal Components - Module - Types
 */

import type { KeyType } from '../../../types'

export type McpAccessLevel = 'ro' | 'rw' | 'admin'

export interface KeyTypeSelectorProps {
  keyType: KeyType
  onKeyTypeChange: (type: KeyType) => void
}

export interface McpAccessLevelSelectorProps {
  mcpAccessLevel: McpAccessLevel
  onAccessLevelChange: (level: McpAccessLevel, scopes: string[]) => void
}

export interface ScopeSelectorProps {
  scopes: string[]
  onScopeToggle: (scope: string) => void
  showScopeDetails: boolean
}

export interface WarningBannersProps {
  keyType: KeyType
  mcpAccessLevel?: McpAccessLevel
  config: { warning: string }
}
