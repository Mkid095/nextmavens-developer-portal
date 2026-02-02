/**
 * Dashboard Hooks - Module - API Key Modal Hook
 */

import { useState, useCallback } from 'react'
import type { CreateApiKeyData, KeyEnvironment } from '../types'
import { DEFAULT_KEY_ENVIRONMENT } from '../constants'

export function useApiKeyModal(addToast: (type: 'success' | 'error', message: string) => void) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyName, setApiKeyName] = useState('')
  const [keyEnvironment, setKeyEnvironment] = useState<KeyEnvironment>(DEFAULT_KEY_ENVIRONMENT)
  const [error, setError] = useState('')

  const openCreateKeyModal = useCallback(() => {
    setApiKeyName('')
    setKeyEnvironment(DEFAULT_KEY_ENVIRONMENT)
    setError('')
    setShowApiKeyModal(true)
  }, [])

  const closeCreateKeyModal = useCallback(() => {
    setShowApiKeyModal(false)
    setApiKeyName('')
    setKeyEnvironment(DEFAULT_KEY_ENVIRONMENT)
    setError('')
  }, [])

  const handleCreateApiKey = useCallback(async (data: CreateApiKeyData, onSuccess: (secretKey: string, name: string) => void) => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          key_type: data.key_type,
          environment: data.environment,
          scopes: data.scopes,
        }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create API key')
      }

      onSuccess(responseData.secretKey, data.name)
      addToast('success', 'API key created successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create API key'
      addToast('error', message)
      throw err
    }
  }, [addToast])

  return {
    showApiKeyModal,
    apiKeyName,
    keyEnvironment,
    error,
    setShowApiKeyModal,
    setApiKeyName,
    setKeyEnvironment,
    setError,
    openCreateKeyModal,
    closeCreateKeyModal,
    handleCreateApiKey,
  }
}
