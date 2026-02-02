/**
 * Use Key Usage Stats Hook (US-006)
 */

import { useEffect, useCallback, useState } from 'react'
import type { ApiKey, KeyUsageStats } from '../../types'

export function useKeyUsageStats(apiKeys: ApiKey[]): {
  usageStats: Record<string, KeyUsageStats>
  loading: Record<string, boolean>
  fetchKeyUsageStats: (keyId: string) => Promise<void>
} {
  const [usageStats, setUsageStats] = useState<Record<string, KeyUsageStats>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const fetchKeyUsageStats = useCallback(async (keyId: string) => {
    setLoading((prev) => ({ ...prev, [keyId]: true }))
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/keys/${keyId}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: KeyUsageStats = await res.json()
        setUsageStats((prev) => ({ ...prev, [keyId]: data }))
      }
    } catch (err) {
      console.error(`Failed to fetch usage stats for key ${keyId}:`, err)
    } finally {
      setLoading((prev) => ({ ...prev, [keyId]: false }))
    }
  }, [])

  useEffect(() => {
    if (apiKeys.length > 0) {
      apiKeys.forEach((key) => {
        fetchKeyUsageStats(key.id)
      })
    }
  }, [apiKeys, fetchKeyUsageStats])

  return { usageStats, loading, fetchKeyUsageStats }
}
