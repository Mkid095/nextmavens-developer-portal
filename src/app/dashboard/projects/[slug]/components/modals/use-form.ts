/**
 * Create API Key Modal Form Hook
 */

import { useState } from 'react'
import type { KeyType, McpAccessLevel } from '../../types'
import { KEY_TYPE_CONFIG } from '../../types'
import { MCP_ACCESS_LEVELS } from './constants'

export function useCreateApiKeyForm() {
  const [name, setName] = useState('')
  const [keyType, setKeyType] = useState<KeyType>('public')
  const [environment, setEnvironment] = useState<'live' | 'test' | 'dev'>('live')
  const [scopes, setScopes] = useState<string[]>(KEY_TYPE_CONFIG.public.defaultScopes)
  const [mcpAccessLevel, setMcpAccessLevel] = useState<McpAccessLevel>('ro')
  const [showScopeDetails, setShowScopeDetails] = useState(false)

  const handleKeyTypeChange = (newKeyType: KeyType) => {
    setKeyType(newKeyType)
    setScopes(KEY_TYPE_CONFIG[newKeyType].defaultScopes)
  }

  const handleScopeToggle = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const handleMcpAccessLevelChange = (level: McpAccessLevel) => {
    setMcpAccessLevel(level)
    const config = MCP_ACCESS_LEVELS[level]
    setScopes(config.scopes)
  }

  const resetForm = () => {
    setName('')
    setKeyType('public')
    setEnvironment('live')
    setScopes(KEY_TYPE_CONFIG.public.defaultScopes)
    setMcpAccessLevel('ro')
    setShowScopeDetails(false)
  }

  return {
    form: { name, keyType, environment, scopes, mcpAccessLevel, showScopeDetails },
    setters: {
      setName,
      setKeyType: handleKeyTypeChange,
      setEnvironment,
      setScopes: handleScopeToggle,
      setMcpAccessLevel: handleMcpAccessLevelChange,
      setShowScopeDetails,
    },
    resetForm,
  }
}
