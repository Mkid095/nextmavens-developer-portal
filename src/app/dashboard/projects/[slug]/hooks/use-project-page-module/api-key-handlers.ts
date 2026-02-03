/**
 * Project Page Hook - Module - API Key Handlers
 */

import type { CreateApiKeyData } from '../types'
import { API_ENDPOINTS } from '../constants'

export async function createApiKey(
  data: CreateApiKeyData,
  callbacks: {
    onSuccess: (newKey: any) => void
    onError: (error: string) => void
    onFinally: () => void
  }
): Promise<void> {
  const token = localStorage.getItem('accessToken')
  const requestBody = {
    name: data.name,
    key_type: data.keyType,
    environment: data.environment,
    scopes: data.scopes,
  }

  if (data.keyType === 'mcp') {
    Object.assign(requestBody, { mcp_access_level: data.mcpAccessLevel })
  }

  const res = await fetch(API_ENDPOINTS.CREATE_KEY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  })

  const responseData = await res.json()

  if (!res.ok) {
    throw new Error(responseData.error || 'Failed to create API key')
  }

  callbacks.onSuccess(responseData)
}

export async function rotateApiKey(
  keyId: string,
  callbacks: {
    onSuccess: (newKey: any) => void
    onError: (error: string) => void
    onFinally: () => void
  }
): Promise<void> {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(API_ENDPOINTS.ROTATE_KEY(keyId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to rotate API key')
  }

  callbacks.onSuccess({
    apiKey: data.newKey,
    secretKey: data.secretKey,
  })
}

export async function revokeApiKey(
  keyId: string,
  callbacks: {
    onSuccess: () => void
    onError: (error: string) => void
    onFinally: () => void
  }
): Promise<void> {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(API_ENDPOINTS.REVOKE_KEY(keyId), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to revoke API key')
  }

  callbacks.onSuccess()
}

export async function deleteApiKey(
  keyId: string,
  callbacks: {
    onSuccess: () => void
  }
): Promise<void> {
  if (!confirm('Delete this API key? This cannot be undone.')) {
    return
  }

  await fetch(API_ENDPOINTS.DELETE_KEY(keyId), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
  }).then(() => callbacks.onSuccess())
}
