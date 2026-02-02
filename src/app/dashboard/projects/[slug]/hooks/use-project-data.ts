/**
 * Use Project Data Hook
 */

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '../../types'

export interface UseProjectDataResult {
  project: Project | null
  loading: boolean
  error: string | null
  fetchProject: () => Promise<void>
}

export function useProjectData(slug: string | undefined): UseProjectDataResult {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!slug) return

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/by-slug?slug=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || 'Failed to load project')
        return
      }
      const data = await res.json()
      setProject(data.project)
    } catch (err) {
      console.error('Failed to fetch project:', err)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [slug, router])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return { project, loading, error, fetchProject }
}
