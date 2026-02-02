/**
 * Team Members List Component
 * Displays list of team members with actions
 */

'use client'

import { Users, Mail, Shield, Trash2, MoreVertical } from 'lucide-react'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../constants'
import { getRoleBadgeColor, getStatusBadgeColor } from '../utils'
import type { ExtendedMember, Role } from '../types'

interface TeamMembersListProps {
  members: ExtendedMember[]
  canManageMembers: boolean
  canManageUsers: boolean
  activeMenu: string | null
  onMenuToggle: (userId: string | null) => void
  onChangeRole: (member: ExtendedMember) => void
  onRemoveMember: (userId: string) => void
  onResendInvitation: (email: string) => void
}

export function TeamMembersList({
  members,
  canManageMembers,
  canManageUsers,
  activeMenu,
  onMenuToggle,
  onChangeRole,
  onRemoveMember,
  onResendInvitation,
}: TeamMembersListProps) {
  return (
    <>
      <div className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.user_id}
            member={member}
            canManageMembers={canManageMembers}
            canManageUsers={canManageUsers}
            isMenuOpen={activeMenu === member.user_id}
            onMenuToggle={onMenuToggle}
            onChangeRole={onChangeRole}
            onRemoveMember={onRemoveMember}
            onResendInvitation={onResendInvitation}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Role Permissions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([role, label]) => (
            <div key={role} className="flex items-start gap-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(role)} mt-0.5`}>
                {label}
              </span>
              <span className="text-sm text-slate-600">{ROLE_DESCRIPTIONS[role]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

interface MemberRowProps {
  member: ExtendedMember
  canManageMembers: boolean
  canManageUsers: boolean
  isMenuOpen: boolean
  onMenuToggle: (userId: string | null) => void
  onChangeRole: (member: ExtendedMember) => void
  onRemoveMember: (userId: string) => void
  onResendInvitation: (email: string) => void
}

function MemberRow({
  member,
  canManageMembers,
  canManageUsers,
  isMenuOpen,
  onMenuToggle,
  onChangeRole,
  onRemoveMember,
  onResendInvitation,
}: MemberRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${
        member.isOwner ? 'bg-purple-50 border-purple-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          member.isOwner ? 'bg-purple-200' : 'bg-slate-200'
        }`}>
          <Users className={`w-5 h-5 ${
            member.isOwner ? 'text-purple-700' : 'text-slate-700'
          }`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">{member.name}</p>
            {member.status === 'pending' && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeColor(member.status)}`}>
                Pending
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(member.role)}`}>
          {ROLE_LABELS[member.role as Role]}
        </span>

        {/* Action menu */}
        {!member.isOwner && (canManageMembers || canManageUsers) && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMenuToggle(isMenuOpen ? null : (member.user_id ?? null))
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-10">
                <div className="py-1">
                  {canManageUsers && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onMenuToggle(null)
                        onChangeRole(member)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Change Role
                    </button>
                  )}
                  {member.status === 'pending' && canManageMembers && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onMenuToggle(null)
                        onResendInvitation(member.email)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Resend Invitation
                    </button>
                  )}
                  {canManageUsers && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onMenuToggle(null)
                        onRemoveMember(member.user_id!)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Member
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
