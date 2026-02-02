/**
 * Break Glass Powers Hook
 * Handles administrative power execution
 */

import { useState } from 'react'
import type { Power, BreakGlassSession } from '../types'

interface UseBreakGlassPowersOptions {
  session: BreakGlassSession | null
  onExecuteSuccess: (message: string) => void
  onExecuteError: (message: string) => void
}

export function useBreakGlassPowers({
  session,
  onExecuteSuccess,
  onExecuteError,
}: UseBreakGlassPowersOptions) {
  const [showPowerWarning, setShowPowerWarning] = useState<Power | null>(null)
  const [projectId, setProjectId] = useState('')

  const handlePowerClick = (power: Power) => {
    setProjectId('')
    setShowPowerWarning(power)
  }

  const handleExecutePower = async () => {
    if (!showPowerWarning || !session) return

    if (!projectId.trim()) {
      onExecuteError('Please enter a project ID')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const endpoint = showPowerWarning.endpoint.replace('{id}', projectId.trim())

      const res = await fetch(endpoint, {
        method: showPowerWarning.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Break-Glass-Token': session.session_token,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || data.details || 'Failed to execute power')
      }

      onExecuteSuccess(`${showPowerWarning.name} executed successfully`)
      setShowPowerWarning(null)
      setProjectId('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to execute power'
      onExecuteError(message)
    }
  }

  const closePowerWarning = () => {
    setShowPowerWarning(null)
    setProjectId('')
  }

  return {
    showPowerWarning,
    projectId,
    setProjectId,
    handlePowerClick,
    handleExecutePower,
    closePowerWarning,
  }
}
