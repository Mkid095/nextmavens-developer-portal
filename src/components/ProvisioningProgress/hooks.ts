/**
 * Provisioning Progress Hooks
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { ProvisioningProgressResponse, ProvisioningStepResponse } from './types'

export function useProvisioningProgress(projectId: string) {
  const [progress, setProgress] = useState<ProvisioningProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryingStep, setRetryingStep] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/provisioning`)
      if (!response.ok) {
        if (response.status === 404) {
          setProgress(null)
          setLoading(false)
          return
        }
        throw new Error('Failed to fetch provisioning progress')
      }
      const data = await response.json()
      setProgress(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching provisioning progress:', err)
      setError('Failed to load provisioning progress')
      setLoading(false)
    }
  }, [projectId])

  const retryStep = useCallback(async (stepName: string) => {
    setRetryingStep(stepName)
    try {
      const response = await fetch(`/api/projects/${projectId}/provisioning/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_name: stepName }),
      })

      if (!response.ok) {
        throw new Error('Failed to retry step')
      }

      await fetchProgress()
    } catch (err) {
      console.error('Error retrying step:', err)
      setError('Failed to retry step')
    } finally {
      setRetryingStep(null)
    }
  }, [projectId, fetchProgress])

  useEffect(() => {
    fetchProgress()
    const interval = setInterval(fetchProgress, 2000)
    return () => clearInterval(interval)
  }, [fetchProgress])

  return { progress, loading, error, retryingStep, fetchProgress, retryStep }
}

export function useProvisioningProgressBar(projectId: string) {
  const [progress, setProgress] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/provisioning`)
        if (response.ok) {
          const data = await response.json()
          setProgress(data.progress)

          if (data.progress === 100) {
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.error('Error fetching progress:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
    const interval = setInterval(fetchProgress, 2000)
    return () => clearInterval(interval)
  }, [projectId])

  return { progress, loading }
}
