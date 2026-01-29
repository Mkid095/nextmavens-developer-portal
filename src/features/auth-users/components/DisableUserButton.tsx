'use client'

import { useState } from 'react'
import { Loader2, Ban, CheckCircle } from 'lucide-react'
import type { EndUserDetailResponse } from '@/lib/types/auth-user.types'

interface DisableUserButtonProps {
  user: EndUserDetailResponse
  onDisable: (userId: string) => Promise<void>
  onEnable: (userId: string) => Promise<void>
  isLoading?: boolean
}

export function DisableUserButton({
  user,
  onDisable,
  onEnable,
  isLoading = false,
}: DisableUserButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const isDisabled = user.status === 'disabled'

  const handleClick = async () => {
    setIsProcessing(true)
    try {
      if (isDisabled) {
        await onEnable(user.user_id)
      } else {
        await onDisable(user.user_id)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const buttonClass = isDisabled
    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
    : 'bg-amber-600 text-white hover:bg-amber-700'

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isProcessing}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isProcessing || isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isDisabled ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Ban className="w-4 h-4" />
      )}
      <span>{isDisabled ? 'Enable User' : 'Disable User'}</span>
    </button>
  )
}
