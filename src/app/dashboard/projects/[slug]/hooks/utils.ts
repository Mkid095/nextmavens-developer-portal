/**
 * Utility Hooks and Functions
 */

import { useState, useCallback } from 'react'
import type { ApiKey } from '../../types'

/**
 * Copy to clipboard hook
 */
export function useCopyToClipboard(): {
  copied: string | null
  copy: (text: string, id: string) => void
} {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return { copied, copy }
}

/**
 * Check if a key is inactive (not used in 30 days)
 */
export function isKeyInactive(key: ApiKey): boolean {
  if (!key.last_used) return false
  const lastUsed = new Date(key.last_used)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return lastUsed < thirtyDaysAgo
}

/**
 * Format last used date as human-readable string
 */
export function formatLastUsed(lastUsed: string | null | undefined): string {
  if (!lastUsed) return 'Never'
  const date = new Date(lastUsed)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}
