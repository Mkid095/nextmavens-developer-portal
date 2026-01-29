'use client'

import { Key, Calendar, Shield } from 'lucide-react'
import type { UserDetail } from '../types'

interface UserAuthInfoProps {
  user: UserDetail
}

export function UserAuthInfo({ user }: UserAuthInfoProps) {
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  const getAuthProviderLabel = (provider: string) => {
    if (provider === 'oauth_google') return 'Google OAuth'
    if (provider === 'oauth_github') return 'GitHub OAuth'
    if (provider === 'oauth_gitlab') return 'GitLab OAuth'
    return 'Email & Password'
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-3">Authentication</h4>
      <dl className="space-y-3">
        <div className="flex items-start gap-3">
          <Key className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <dt className="text-xs text-slate-500">Auth Provider</dt>
            <dd className="text-sm text-slate-900">{getAuthProviderLabel(user.auth_provider)}</dd>
          </div>
        </div>

        {user.auth_info && (
          <>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs text-slate-500">Last Sign In</dt>
                <dd className="text-sm text-slate-900">
                  {formatTimestamp(user.auth_info.last_login_at)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-xs text-slate-500">Sign In Count</dt>
                <dd className="text-sm text-slate-900">{user.auth_info.sign_in_count}</dd>
              </div>
            </div>
          </>
        )}
      </dl>
    </div>
  )
}
