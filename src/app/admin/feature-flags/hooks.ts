/**
 * Feature Flags Page - Custom Hooks
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FeatureFlag, FlagsResponse } from './types'

export function useFeatureFlags() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlags = async () => {
    setFetching(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/feature-flags', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data: FlagsResponse = await res.json()

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
          return
        }
        if (res.status === 403) {
          setError('You do not have permission to access feature flags. Admin or operator role required.')
          return
        }
        throw new Error(data.error || data.details || 'Failed to fetch feature flags')
      }

      setFlags(data.flags || [])
    } catch (err: any) {
      console.error('Failed to fetch feature flags:', err)
      setError(err.message || 'Failed to fetch feature flags')
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchFlags()
  }, [router])

  return { loading, flags, fetching, error, fetchFlags, setFlags, setError }
}

export function useToasts() {
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([])

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  return { toasts, addToast }
}
