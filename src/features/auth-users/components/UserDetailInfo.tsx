import { Calendar, Shield } from 'lucide-react'
import type { EndUserDetailResponse } from '@/lib/types/auth-user.types'

interface UserDetailInfoProps {
  user: EndUserDetailResponse
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

export function UserDetailInfo({ user }: UserDetailInfoProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">User Information</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            User ID
          </label>
          <p className="text-slate-900 font-mono text-sm">{user.user_id}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            Email
          </label>
          <p className="text-slate-900">{user.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            Name
          </label>
          <p className="text-slate-900">{user.name || 'Not set'}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            Auth Provider
          </label>
          <p className="text-slate-900 capitalize">{user.auth_provider}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            Status
          </label>
          <p className="text-slate-900 capitalize">{user.status}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            Sign In Count
          </label>
          <p className="text-slate-900">{user.sign_in_count.toLocaleString()}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            Created At
          </label>
          <div className="flex items-center gap-2 text-slate-900">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatDate(user.created_at)}</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 block mb-1">
            Last Sign In
          </label>
          <div className="flex items-center gap-2 text-slate-900">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>{formatDate(user.last_sign_in_at)}</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-500 block mb-1">
            User Metadata
          </label>
          <pre className="bg-slate-50 p-3 rounded-lg text-sm font-mono text-slate-800 overflow-x-auto">
            {JSON.stringify(user.user_metadata, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
