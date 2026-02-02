/**
 * Deletion Preview Modal - Custom Hook
 */

import { useState, useEffect } from 'react'
import type { DeletionPreviewData } from '../types'

export function useDeletionPreview(isOpen: boolean, projectId: string) {
  const [preview, setPreview] = useState<DeletionPreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && projectId) {
      fetchDeletionPreview()
    }
  }, [isOpen, projectId])

  const fetchDeletionPreview = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/deletion-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to load deletion preview' }))
        throw new Error(data.error || 'Failed to load deletion preview')
      }

      const data = await res.json()
      setPreview(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load deletion preview')
    } finally {
      setLoading(false)
    }
  }

  return { preview, loading, error, fetchDeletionPreview }
}
