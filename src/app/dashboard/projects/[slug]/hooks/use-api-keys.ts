/**
 * Use API Keys Hook
 */

import { useEffect, useCallback, useState } from 'react'
import type { ApiKey } from '../../types'

export function useApiKeys(): {
  apiKeys: ApiKey[]
  loading: boolean
  fetchApiKeys: () => Promise<void>
} {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApiKeys = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApiKeys()
  }, [fetchApiKeys])

  return { apiKeys, loading, fetchApiKeys }
}
