/**
 * Dashboard Main Hook
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectFilter } from './types'
import { DEFAULT_PROJECT_FILTER } from './constants'
import {
  useToasts,
  useDashboardData,
  useRestoreProject,
  useCopyToClipboard,
  useApiKeyModal,
  useProjectModal,
  useSecretModal,
} from './hooks'

export function useDashboard() {
  const router = useRouter()
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>(DEFAULT_PROJECT_FILTER)

  const { toasts, addToast } = useToasts()
  const { developer, apiKeys, projects, deletedProjects, loading, refetchData } = useDashboardData()
  const { handleRestore } = useRestoreProject(addToast)
  const { copied, handleCopy, setCopied } = useCopyToClipboard(addToast)
  const apiKeyModal = useApiKeyModal(addToast)
  const projectModal = useProjectModal(addToast)
  const secretModal = useSecretModal()

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const handleRestoreWithRefetch = async (projectId: string, projectName: string) => {
    await handleRestore(projectId, projectName, refetchData)
  }

  const handleCreateApiKeyWithSecret = async (data: any) => {
    await apiKeyModal.handleCreateApiKey(data, (secretKey: string, name: string) => {
      apiKeyModal.setShowApiKeyModal(false)
      secretModal.showSecret(secretKey, name)
      refetchData()
    })
  }

  const handleCreateProjectWithModal = async (e: React.FormEvent) => {
    await projectModal.handleCreateProject(e, () => {
      projectModal.setShowProjectModal(false)
      refetchData()
    })
  }

  return {
    developer,
    apiKeys,
    projects,
    deletedProjects,
    loading,
    projectFilter,
    copied,
    toasts,
    ...apiKeyModal,
    ...projectModal,
    ...secretModal,
    submitting: projectModal.submitting,
    error: projectModal.error || apiKeyModal.error,
    // Setters
    setProjectFilter,
    setCopied,
    // Handlers
    handleRestore: handleRestoreWithRefetch,
    handleLogout,
    handleCreateApiKey: handleCreateApiKeyWithSecret,
    handleCreateProject: handleCreateProjectWithModal,
    handleCopy,
  }
}
