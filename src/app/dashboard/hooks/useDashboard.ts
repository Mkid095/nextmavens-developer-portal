/**
 * useDashboard Hook
 *
 * Main custom hook for dashboard page logic and state management.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  Developer,
  ApiKey,
  Project,
  Toast,
  ProjectFilter,
  KeyEnvironment,
  ProjectEnvironment,
} from '../types'
import { useDashboardAuth } from './useDashboardAuth'
import { useDashboardActions } from './useDashboardActions'

export function useDashboard() {
  const router = useRouter()

  // Data state
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('active')
  const [copied, setCopied] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Modal states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [createdSecretKey, setCreatedSecretKey] = useState('')
  const [createdKeyName, setCreatedKeyName] = useState('')

  // Form states
  const [apiKeyName, setApiKeyName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [keyEnvironment, setKeyEnvironment] = useState<KeyEnvironment>('live')
  const [projectEnvironment, setProjectEnvironment] = useState<ProjectEnvironment>('prod')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Use auth hook
  const { fetchDeveloperData, fetchApiKeys, fetchProjects, fetchDeletedProjects } = useDashboardAuth()

  // Toast notification helper
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  // Use actions hook
  const { handleCreateApiKey, handleCreateProject, handleRestore, handleLogout, handleCopy } = useDashboardActions(addToast)

  // Initialize data
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      const [devData, keys, projs, delProjs] = await Promise.all([
        fetchDeveloperData(),
        fetchApiKeys(),
        fetchProjects(),
        fetchDeletedProjects(),
      ])

      if (devData) setDeveloper(devData)
      setApiKeys(keys)
      setProjects(projs)
      setDeletedProjects(delProjs)
      setLoading(false)
    }

    loadData()
  }, [router, fetchDeveloperData, fetchApiKeys, fetchProjects, fetchDeletedProjects])

  // Wrapper for create API key with modal handling
  const handleCreateApiKeyWithModal = useCallback(async (data: { name: string; key_type: string; environment: string }) => {
    try {
      const result = await handleCreateApiKey(data)
      if (result.success && result.secretKey) {
        setCreatedSecretKey(result.secretKey)
        setCreatedKeyName(data.name)
        setShowApiKeyModal(false)
        setShowSecretModal(true)

        // Refresh API keys
        const keys = await fetchApiKeys()
        setApiKeys(keys)
      }
    } catch (err) {
      // Error already handled in hook
      throw err
    }
  }, [handleCreateApiKey, fetchApiKeys])

  // Wrapper for create project with modal handling
  const handleCreateProjectWithModal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!projectName.trim()) {
      setError('Please enter a project name')
      return
    }

    setSubmitting(true)

    const result = await handleCreateProject(projectName.trim(), projectEnvironment)
    if (result.success) {
      setShowProjectModal(false)

      // Refresh projects
      const projs = await fetchProjects()
      setProjects(projs)
    }

    setSubmitting(false)
  }, [projectName, projectEnvironment, handleCreateProject, fetchProjects])

  // Wrapper for restore with refresh
  const handleRestoreWithRefresh = useCallback(async (projectId: string, projectName: string) => {
    const result = await handleRestore(projectId, projectName)
    if (result.success) {
      // Refresh projects
      const [projs, delProjs] = await Promise.all([fetchProjects(), fetchDeletedProjects()])
      setProjects(projs)
      setDeletedProjects(delProjs)
    }
  }, [handleRestore, fetchProjects, fetchDeletedProjects])

  // Copy handler with copied state
  const handleCopyWithState = useCallback((text: string, id: string) => {
    handleCopy(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }, [handleCopy])

  // Copy secret key handler
  const handleCopySecretKey = useCallback(() => {
    navigator.clipboard.writeText(createdSecretKey)
    addToast('success', 'Secret key copied to clipboard')
  }, [createdSecretKey, addToast])

  // Modal handlers
  const openCreateKeyModal = () => {
    setApiKeyName('')
    setKeyEnvironment('live')
    setError('')
    setShowApiKeyModal(true)
  }

  const closeCreateKeyModal = () => {
    setShowApiKeyModal(false)
    setApiKeyName('')
    setKeyEnvironment('live')
    setError('')
  }

  const openCreateProjectModal = () => {
    setProjectName('')
    setProjectEnvironment('prod')
    setError('')
    setShowProjectModal(true)
  }

  const closeCreateProjectModal = () => {
    setShowProjectModal(false)
    setProjectName('')
    setProjectEnvironment('prod')
    setError('')
  }

  return {
    // State
    developer,
    apiKeys,
    projects,
    deletedProjects,
    loading,
    projectFilter,
    copied,
    toasts,
    showApiKeyModal,
    showProjectModal,
    showSecretModal,
    createdSecretKey,
    createdKeyName,
    apiKeyName,
    projectName,
    keyEnvironment,
    projectEnvironment,
    submitting,
    error,

    // Setters
    setProjectFilter,
    setApiKeyName,
    setProjectName,
    setKeyEnvironment,
    setProjectEnvironment,
    setShowSecretModal,

    // Handlers
    handleLogout,
    handleRestore: handleRestoreWithRefresh,
    handleCreateApiKey: handleCreateApiKeyWithModal,
    handleCreateProject: handleCreateProjectWithModal,
    handleCopy: handleCopyWithState,
    handleCopySecretKey,
    openCreateKeyModal,
    closeCreateKeyModal,
    openCreateProjectModal,
    closeCreateProjectModal,
    addToast,
  }
}
