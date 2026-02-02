/**
 * useDashboardActions Hook
 *
 * Action handlers for dashboard operations.
 */

'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectEnvironment } from '../types'

export function useDashboardActions(addToast: (type: 'success' | 'error', message: string) void) {
  const router = useRouter()

  const fetchWithAuth = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('accessToken')
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.status === 401) {
      localStorage.clear()
      router.push('/login')
      return null
    }

    return res
  }, [router])

  const handleCreateApiKey = useCallback(async (data: { name: string; key_type: string; environment: string; scopes?: string[] }) => {
    try {
      const res = await fetchWithAuth('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          key_type: data.key_type,
          environment: data.environment,
          scopes: data.scopes || ['read', 'write'],
        }),
      })

      if (!res) {
        throw new Error('Authentication failed')
      }

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create API key')
      }

      return { success: true, secretKey: responseData.secretKey }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create API key')
      throw err
    }
  }, [fetchWithAuth, addToast])

  const handleCreateProject = useCallback(async (projectName: string, projectEnvironment: ProjectEnvironment) => {
    try {
      const res = await fetchWithAuth('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName.trim(),
          environment: projectEnvironment,
        }),
      })

      if (!res) {
        throw new Error('Authentication failed')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      addToast('success', 'Project created successfully')
      return { success: true }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create project')
      return { success: false, error: err.message }
    }
  }, [fetchWithAuth, addToast])

  const handleRestore = useCallback(async (projectId: string, projectName: string) => {
    try {
      const res = await fetchWithAuth(`/api/projects/${projectId}/restore`, {
        method: 'POST',
      })

      if (!res) {
        throw new Error('Authentication failed')
      }

      if (res.ok) {
        addToast('success', `Project "${projectName}" restored successfully`)
        return { success: true }
      } else {
        const data = await res.json()
        addToast('error', data.error || 'Failed to restore project')
        return { success: false }
      }
    } catch (err) {
      console.error('Failed to restore project:', err)
      addToast('error', 'Failed to restore project')
      return { success: false }
    }
  }, [fetchWithAuth, addToast])

  const handleLogout = useCallback(() => {
    localStorage.clear()
    router.push('/')
  }, [router])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    addToast('success', 'Copied to clipboard')
  }, [addToast])

  return {
    handleCreateApiKey,
    handleCreateProject,
    handleRestore,
    handleLogout,
    handleCopy,
  }
}
