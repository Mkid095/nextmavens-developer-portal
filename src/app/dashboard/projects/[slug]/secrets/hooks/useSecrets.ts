/**
 * useSecrets Hook
 * Handles secrets data fetching and management
 */

import { useEffect } from 'react'
import { secretsApi } from '@/lib/api/secrets-client'
import type { Secret } from '@/lib/types/secrets.types'
import type { Project } from './types'

interface UseSecretsProps {
  project: Project | null
  onSuccess: (secrets: Secret[]) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
}

export function useSecrets({ project, onSuccess, onError, onLoadingChange }: UseSecretsProps) {
  useEffect(() => {
    if (!project?.id) return

    onLoadingChange(true)

    secretsApi.list(project.id)
      .then((response) => {
        onSuccess(response.data || [])
      })
      .catch((err: any) => {
        onError(err.message || 'Failed to fetch secrets')
      })
      .finally(() => {
        onLoadingChange(false)
      })
  }, [project, onSuccess, onError, onLoadingChange])
}
