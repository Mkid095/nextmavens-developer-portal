/**
 * Status Page - Module - Loading State Component
 */

import { LOADING_TEXT } from '../constants'

export function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-500">{LOADING_TEXT}</div>
    </div>
  )
}
