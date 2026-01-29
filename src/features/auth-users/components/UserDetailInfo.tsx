import { Calendar, Shield } from 'lucide-react'
import type { EndUserDetailResponse } from '@/lib/types/auth-user.types'
import { UserMetadataEdit } from '@/features/auth-users/components/UserMetadataEdit'

interface UserDetailInfoProps {
  user: EndUserDetailResponse
  onMetadataUpdated?: (metadata: Record<string, unknown>) => void
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

export function UserDetailInfo({ user, onMetadataUpdated }: UserDetailInfoProps) {
  return (
    <div className="space-y-6">
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
              Updated At
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDate(user.updated_at)}</span>
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
        </div>
      </div>

      <UserMetadataEdit user={user} onMetadataUpdated={onMetadataUpdated || (() => {})} />
    </div>
  )
}
