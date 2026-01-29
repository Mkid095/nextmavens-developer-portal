'use client'

import { Mail } from 'lucide-react'
import type { UserDetail } from '../types'

interface UserHeaderProps {
  user: UserDetail
}

export function UserHeader({ user }: UserHeaderProps) {
  const getRoleBadgeColor = (role: string) => {
    if (role === 'admin') return 'bg-red-100 text-red-800'
    if (role === 'operator') return 'bg-blue-100 text-blue-800'
    return 'bg-slate-100 text-slate-800'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-1">
              {user.name || 'No name provided'}
            </h3>
            <p className="text-slate-600 mb-2">{user.email}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(user.role)}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.organization && (
                <span className="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700">
                  {user.organization}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
