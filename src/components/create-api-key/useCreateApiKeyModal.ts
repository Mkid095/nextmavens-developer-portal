/**
 * useCreateApiKeyModal Hook
 *
 * Manages state and logic for the Create API Key modal.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ApiKeyType, ApiKeyEnvironment, ApiKeyScope, DEFAULT_SCOPES } from '@/lib/types/api-key.types'
import type { KeyTypeOption, CreateKeyData, CreatedKeyDisplay } from './types'
import { KEY_TYPE_OPTIONS } from './constants'

interface UseCreateApiKeyModalProps {
  isOpen: boolean
  onCreateKey: (data: CreateKeyData) => Promise<void>
}

type ModalStep = 'type' | 'config' | 'confirm-write' | 'confirm-admin' | 'success'

export function useCreateApiKeyModal({ isOpen, onCreateKey }: UseCreateApiKeyModalProps) {
  const [step, setStep] = useState<ModalStep>('type')
  const [selectedKeyType, setSelectedKeyType] = useState<KeyTypeOption | null>(null)
  const [keyName, setKeyName] = useState('')
  const [environment, setEnvironment] = useState<ApiKeyEnvironment>('prod')
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>([])
  const [mcpAccessLevel, setMcpAccessLevel] = useState<'ro' | 'rw' | 'admin'>('ro')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [writeWarningConfirmed, setWriteWarningConfirmed] = useState(false)
  const [adminWarningConfirmed, setAdminWarningConfirmed] = useState(false)
  const [createdKey, setCreatedKey] = useState<CreatedKeyDisplay | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('type')
      setSelectedKeyType(null)
      setKeyName('')
      setEnvironment('prod')
      setSelectedScopes([])
      setMcpAccessLevel('ro')
      setError('')
      setWriteWarningConfirmed(false)
      setAdminWarningConfirmed(false)
      setCreatedKey(null)
    }
  }, [isOpen])

  // Update scopes when key type changes
  useEffect(() => {
    if (selectedKeyType) {
      if (selectedKeyType.type === 'mcp') {
        setSelectedScopes(DEFAULT_SCOPES[`mcp_${mcpAccessLevel}`] || DEFAULT_SCOPES.mcp_ro)
      } else {
        setSelectedScopes(selectedKeyType.defaultScopes)
      }
    }
  }, [selectedKeyType, mcpAccessLevel])

  const handleKeyTypeSelect = useCallback((option: KeyTypeOption) => {
    setSelectedKeyType(option)
    setStep('config')
  }, [])

  const handleBack = useCallback(() => {
    setStep('type')
  }, [])

  const handleScopeToggle = useCallback((scope: ApiKeyScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }, [])

  const handleCreateKey = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!selectedKeyType || !keyName.trim()) {
      setError('Please fill in all required fields')
      return
    }

    // US-006: Show warning confirmation for MCP write/admin tokens
    // US-005: Admin tokens require EXTRA confirmation beyond write confirmation
    if (selectedKeyType.type === 'mcp' && mcpAccessLevel === 'admin') {
      if (!writeWarningConfirmed) {
        setStep('confirm-write')
        return
      }
      if (!adminWarningConfirmed) {
        setStep('confirm-admin')
        return
      }
    }
    if (selectedKeyType.type === 'mcp' && mcpAccessLevel === 'rw') {
      if (!writeWarningConfirmed) {
        setStep('confirm-write')
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const data: CreateKeyData = {
        name: keyName.trim(),
        key_type: selectedKeyType.type,
        environment,
        scopes: selectedScopes,
      }

      if (selectedKeyType.type === 'mcp') {
        data.mcpAccessLevel = mcpAccessLevel
      }

      await onCreateKey(data)
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Failed to create API key')
    } finally {
      setSubmitting(false)
    }
  }, [selectedKeyType, keyName, environment, selectedScopes, mcpAccessLevel, writeWarningConfirmed, adminWarningConfirmed, onCreateKey])

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const resetForm = useCallback(() => {
    setStep('type')
    setSelectedKeyType(null)
    setKeyName('')
  }, [])

  return {
    // State
    step,
    selectedKeyType,
    keyName,
    environment,
    selectedScopes,
    mcpAccessLevel,
    submitting,
    error,
    writeWarningConfirmed,
    adminWarningConfirmed,
    createdKey,
    copied,

    // Setters
    setKeyName,
    setEnvironment,
    setSelectedScopes,
    setMcpAccessLevel,
    setWriteWarningConfirmed,
    setAdminWarningConfirmed,
    setCreatedKey,

    // Handlers
    handleKeyTypeSelect,
    handleBack,
    handleScopeToggle,
    handleCreateKey,
    handleCopy,
    resetForm,
  }
}
