/**
 * Secrets Page Hook
 */

'use client'

import { useState } from 'react'
import { secretsApi } from '@/lib/api/secrets-client'
import type { Secret, SecretDetails, SecretVersion, CreateSecretRequest, RotateSecretRequest } from '@/lib/types/secrets.types'

export function useSecretsPage(projectId: string | undefined) {
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSecrets = async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const response = await secretsApi.list(projectId)
      setSecrets(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch secrets')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSecret = async (data: CreateSecretRequest) => {
    if (!projectId) throw new Error('Project ID is required')
    await secretsApi.create(data)
    await fetchSecrets()
  }

  const handleDeleteSecret = async (secretId: string) => {
    await secretsApi.delete(secretId)
    await fetchSecrets()
  }

  const handleRotateSecret = async (secretId: string, data: RotateSecretRequest) => {
    await secretsApi.rotate(secretId, data)
    await fetchSecrets()
  }

  const handleFetchSecretDetails = async (id: string): Promise<SecretDetails> => {
    const response = await secretsApi.get(id)
    return response.data
  }

  const handleFetchVersions = async (id: string): Promise<SecretVersion[]> => {
    const response = await secretsApi.listVersions(id)
    return response.data
  }

  return {
    secrets,
    loading,
    error,
    setError,
    fetchSecrets,
    handleCreateSecret,
    handleDeleteSecret,
    handleRotateSecret,
    handleFetchSecretDetails,
    handleFetchVersions,
  }
}
