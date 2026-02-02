/**
 * Dashboard Hooks - Module - Restore Project Hook
 */

import { useCallback } from 'react'

export function useRestoreProject(addToast: (type: 'success' | 'error', message: string) => void) {
  const handleRestore = useCallback(async (projectId: string, projectName: string, onSuccess: () => void) => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/${projectId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        addToast('success', `Project "${projectName}" restored successfully`)
        onSuccess()
      } else {
        const data = await res.json()
        addToast('error', data.error || 'Failed to restore project')
      }
    } catch (err) {
      console.error('Failed to restore project:', err)
      addToast('error', 'Failed to restore project')
    }
  }, [addToast])

  return { handleRestore }
}
