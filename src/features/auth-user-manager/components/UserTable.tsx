'use client'

import { Mail, Calendar, Clock, Shield } from 'lucide-react'
import type { EndUser, UserSort } from '@/lib/types/user.types'

interface UserTableProps {
  users: EndUser[]
  sort: UserSort
  onSort: (column: UserSort['column']) => void
}

export function UserTable({ users, sort, onSort }: UserTableProps) {
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800'
      case 'disabled':
        return 'bg-amber-100 text-amber-800'
      case 'deleted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getAuthProviderIcon = (provider: string) => {
    return <Shield className="w-4 h-4 text-slate-400" />
  }

  if (users.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900">Users ({users.length})</h2>
      </div>

      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
        <div
          className="col-span-3 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition"
          onClick={() => onSort('email')}
        >
          Email
          {sort.column === 'email' && (
            <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div
          className="col-span-2 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition"
          onClick={() => onSort('name')}
        >
          Name
          {sort.column === 'name' && (
            <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div
          className="col-span-2 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition"
          onClick={() => onSort('created_at')}
        >
          Created
          {sort.column === 'created_at' && (
            <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div
          className="col-span-2 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition"
          onClick={() => onSort('last_sign_in_at')}
        >
          Last Sign In
          {sort.column === 'last_sign_in_at' && (
            <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Provider</div>
      </div>

      <div className="divide-y divide-slate-100">
        {users.map((user) => (
          <div key={user.user_id} className="hover:bg-slate-50 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-900 truncate" title={user.email}>
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="col-span-2">
                <span className="text-sm text-slate-700 truncate" title={user.name}>
                  {user.name || 'N/A'}
                </span>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{formatTimestamp(user.created_at)}</span>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{formatTimestamp(user.last_sign_in_at || null)}</span>
                </div>
              </div>

              <div className="col-span-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(
                    user.status
                  )}`}
                >
                  {user.status}
                </span>
              </div>

              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  {getAuthProviderIcon(user.auth_provider)}
                  <span className="text-xs text-slate-600 capitalize">
                    {user.auth_provider}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
