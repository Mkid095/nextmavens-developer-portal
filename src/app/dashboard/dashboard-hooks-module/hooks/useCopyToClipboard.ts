/**
 * Dashboard Hooks - Module - Copy to Clipboard Hook
 */

import { useState, useCallback } from 'react'

export function useCopyToClipboard(addToast: (type: 'success' | 'error', message: string) => void) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    addToast('success', 'Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }, [addToast])

  return { copied, handleCopy, setCopied }
}
