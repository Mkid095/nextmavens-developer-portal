/**
 * Organization Detail Page - Members Section Component
 */

import { Users } from 'lucide-react'
import type { Organization } from '../types'
import { getRoleBadgeColor } from '../utils'

interface MembersSectionProps {
  organization: Organization
}

export function MembersSection({ organization }: MembersSectionProps) {
  const memberCount = (organization.members?.length || 0) + 1

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Members</h2>
        <span className="text-sm text-slate-600">{memberCount} total</span>
      </div>
      <div className="space-y-2">
        {/* Owner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Owner</p>
              <p className="text-sm text-slate-500">ID: {organization.owner_id}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor('owner')}`}>
            owner
          </span>
        </div>
        {/* Members */}
        {organization.members?.map(member => (
          <div
            key={member.user_id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-sm font-medium text-slate-700">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{member.name}</p>
                <p className="text-sm text-slate-500">{member.email}</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(member.role)}`}>
              {member.role}
            </span>
          </div>
        )) || (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No additional members</p>
          </div>
        )}
      </div>
    </div>
  )
}
