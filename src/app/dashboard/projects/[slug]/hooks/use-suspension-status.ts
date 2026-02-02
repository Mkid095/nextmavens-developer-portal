/**
 * Use Suspension Status Hook
 */

import { useEffect, useCallback, useState } from 'react'
import type { Project, SuspensionRecord } from '../../types'
import type { SuspensionStatusResponse } from '../../types'

export function useSuspensionStatus(project: Project | null): {
  suspension: SuspensionRecord | null
  loading: boolean
  fetchSuspensionStatus: () => Promise<void>
} {
  const [suspension, setSuspension] = useState<SuspensionRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSuspensionStatus = useCallback(async () => {
    if (!project) return

    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${project.id}/suspensions`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data: SuspensionStatusResponse = await res.json()
        if (data.suspended && data.suspension) {
          setSuspension(data.suspension)
        } else {
          setSuspension(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch suspension status:', err)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (project) {
      fetchSuspensionStatus()
    }
  }, [project, fetchSuspensionStatus])

  return { suspension, loading, fetchSuspensionStatus }
}
