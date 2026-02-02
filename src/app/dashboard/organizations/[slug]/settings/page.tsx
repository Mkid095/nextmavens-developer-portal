'use client'

/**
 * Organization Settings Page
 * Team management and member settings for organizations
 */

import Link from 'next/link'
import { Loader2, AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { useOrganizationSettings } from './hooks/useOrganizationSettings'
import type { ExtendedMember } from './types'
import {
  PageHeader,
  TeamMembersList,
  InviteMemberModal,
  ChangeRoleModal,
  RemoveMemberModal,
  ToastNotifications,
} from './components'

export default function OrganizationSettingsPage() {
  const {
    organization,
    loading,
    toasts,
    showInviteModal,
    inviteEmail,
    inviteRole,
    inviting,
    memberToDelete,
    deleting,
    memberToChangeRole,
    newRole,
    changingRole,
    activeMenu,
    setInviteEmail,
    setInviteRole,
    setShowInviteModal,
    setMemberToDelete,
    setMemberToChangeRole,
    setNewRole,
    setActiveMenu,
    setToasts,
    handleInviteMember,
    handleRemoveMember,
    handleChangeRole,
    handleResendInvitation,
    canManageMembers,
    canManageUsers,
  } = useOrganizationSettings()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-900 animate-spin" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Organization Not Found</h2>
          <p className="text-slate-600 mb-6">The organization you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/organizations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizations
          </Link>
        </div>
      </div>
    )
  }

  // Combine owner and members for the full list
  const allMembers: ExtendedMember[] = [
    {
      user_id: organization.owner_id,
      name: 'Owner',
      email: `ID: ${organization.owner_id}`,
      role: 'owner',
      status: 'accepted',
      isOwner: true,
    },
    ...(organization.members?.map(m => ({
      ...m,
      isOwner: false,
    })) || []),
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader organization={organization} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
              <p className="text-sm text-slate-600 mt-1">
                Manage who has access to this organization
              </p>
            </div>
            {canManageMembers && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
              >
                <Mail className="w-4 h-4" />
                Invite Member
              </button>
            )}
          </div>

          <TeamMembersList
            members={allMembers}
            canManageMembers={canManageMembers}
            canManageUsers={canManageUsers}
            activeMenu={activeMenu}
            onMenuToggle={setActiveMenu}
            onChangeRole={(member) => {
              setMemberToChangeRole({
                userId: member.user_id!,
                name: member.name,
                currentRole: member.role as any,
              })
              setNewRole(member.role as any)
            }}
            onRemoveMember={setMemberToDelete}
            onResendInvitation={handleResendInvitation}
          />
        </div>
      </main>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        email={inviteEmail}
        onEmailChange={setInviteEmail}
        role={inviteRole}
        onRoleChange={setInviteRole}
        isSubmitting={inviting}
        canManageUsers={canManageUsers}
        onSubmit={handleInviteMember}
      />

      <ChangeRoleModal
        member={memberToChangeRole}
        onClose={() => setMemberToChangeRole(null)}
        newRole={newRole}
        onRoleChange={setNewRole}
        isSubmitting={changingRole}
        onSubmit={handleChangeRole}
      />

      <RemoveMemberModal
        isOpen={memberToDelete !== null}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => memberToDelete && handleRemoveMember(memberToDelete)}
        isDeleting={deleting}
      />

      <ToastNotifications
        toasts={toasts}
        onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />
    </div>
  )
}
