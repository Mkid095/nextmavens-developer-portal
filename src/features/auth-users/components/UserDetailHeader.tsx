import { Mail, ArrowLeft } from 'lucide-react'
import type { EndUserDetailResponse } from '@/lib/types/auth-user.types'
import { DisableUserButton } from './DisableUserButton'

interface UserDetailHeaderProps {
  user: EndUserDetailResponse
  onBack: () => void
  onDisable?: (userId: string) => Promise<void>
  onEnable?: (userId: string) => Promise<void>
  isLoading?: boolean
}

const getStatusBadge = (status: string) => {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (status === 'disabled') {
    return 'bg-amber-100 text-amber-800'
  }
  return 'bg-red-100 text-red-800'
}

const getProviderBadge = (provider: string) => {
  if (provider === 'email') return 'bg-blue-100 text-blue-800'
  if (provider === 'google') return 'bg-red-100 text-red-800'
  if (provider === 'github') return 'bg-slate-100 text-slate-800'
  if (provider === 'microsoft') return 'bg-cyan-100 text-cyan-800'
  return 'bg-slate-100 text-slate-800'
}

export function UserDetailHeader({
  user,
  onBack,
  onDisable,
  onEnable,
  isLoading = false,
}: UserDetailHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Users</span>
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              {user.name || 'No name'}
            </h1>
            <p className="text-slate-600">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onDisable && onEnable && (
            <DisableUserButton
              user={user}
              onDisable={onDisable}
              onEnable={onEnable}
              isLoading={isLoading}
            />
          )}
          <span
            className={`px-3 py-1 text-sm font-medium rounded ${getStatusBadge(user.status)}`}
          >
            {user.status}
          </span>
          <span
            className={`px-3 py-1 text-sm font-medium rounded ${getProviderBadge(user.auth_provider)}`}
          >
            {user.auth_provider}
          </span>
        </div>
      </div>
    </div>
  )
}
