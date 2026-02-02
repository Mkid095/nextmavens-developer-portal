/**
 * Dashboard Hooks - Module - Project Modal Hook
 */

import { useState, useCallback } from 'react'
import type { ProjectEnvironment } from '../types'
import { DEFAULT_PROJECT_ENVIRONMENT } from '../constants'

export function useProjectModal(addToast: (type: 'success' | 'error', message: string) => void) {
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectEnvironment, setProjectEnvironment] = useState<ProjectEnvironment>(DEFAULT_PROJECT_ENVIRONMENT)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const openCreateProjectModal = useCallback(() => {
    setProjectName('')
    setProjectEnvironment(DEFAULT_PROJECT_ENVIRONMENT)
    setError('')
    setShowProjectModal(true)
  }, [])

  const closeCreateProjectModal = useCallback(() => {
    setShowProjectModal(false)
    setProjectName('')
    setProjectEnvironment(DEFAULT_PROJECT_ENVIRONMENT)
    setError('')
  }, [])

  const handleCreateProject = useCallback(async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault()
    setError('')

    if (!projectName.trim()) {
      setError('Please enter a project name')
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_name: projectName.trim(),
          environment: projectEnvironment,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      onSuccess()
      addToast('success', 'Project created successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setError(message)
      addToast('error', message)
    } finally {
      setSubmitting(false)
    }
  }, [projectName, projectEnvironment, addToast])

  return {
    showProjectModal,
    projectName,
    projectEnvironment,
    submitting,
    error,
    setShowProjectModal,
    setProjectName,
    setProjectEnvironment,
    setError,
    openCreateProjectModal,
    closeCreateProjectModal,
    handleCreateProject,
  }
}
