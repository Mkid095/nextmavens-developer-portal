'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  Shield,
  Trash2,
  MoreVertical,
  Check,
  X,
  Clock,
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  user_role?: 'owner' | 'admin' | 'developer' | 'viewer'
  created_at: string
  members?: Array<{
    id?: string
    user_id?: string
    name: string
    email: string
    role: string
    status?: 'pending' | 'accepted'
    joined_at?: string
    invited_by?: string
  }>
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

type Role = 'owner' | 'admin' | 'developer' | 'viewer'

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  developer: 'Developer',
  viewer: 'Viewer',
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full access to all organization resources and settings',
  admin: 'Can manage projects, services, and API keys',
  developer: 'Can view logs and use services',
  viewer: 'Read-only access to logs and resources',
}

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Invite member modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('developer')
  const [inviting, setInviting] = useState(false)

  // Confirm delete modal state
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Change role modal state
  const [memberToChangeRole, setMemberToChangeRole] = useState<{
    userId: string
    name: string
    currentRole: Role
  } | null>(null)
  const [newRole, setNewRole] = useState<Role>('developer')
  const [changingRole, setChangingRole] = useState(false)

  // Menu dropdown state
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchOrganization()
    }
  }, [slug])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      // First get all organizations to find the one with this slug
      const response = await fetch('/api/organizations/with-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }

      const data = await response.json()
      const org = (data.organizations || []).find((o: Organization) => o.slug === slug)

      if (!org) {
        throw new Error('Organization not found')
      }

      // Get detailed organization info including members
      const detailResponse = await fetch(`/api/organizations/${org.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        setOrganization(detailData.data || org)
      } else {
        setOrganization(org)
      }
    } catch (err) {
      console.error('Error fetching organization:', err)
      showToast('error', 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'developer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'viewer':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const canManageMembers = () => {
    return organization?.user_role === 'owner' || organization?.user_role === 'admin'
  }

  const canManageUsers = () => {
    return organization?.user_role === 'owner'
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/organizations/${organization?.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite member')
      }

      showToast('success', `Invitation sent to ${inviteEmail}`)
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('developer')
      fetchOrganization() // Refresh members list
    } catch (err: any) {
      console.error('Error inviting member:', err)
      showToast('error', err.message || 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    setDeleting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/organizations/${organization?.id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      showToast('success', 'Member removed successfully')
      setMemberToDelete(null)
      fetchOrganization() // Refresh members list
    } catch (err: any) {
      console.error('Error removing member:', err)
      showToast('error', err.message || 'Failed to remove member')
    } finally {
      setDeleting(false)
    }
  }

  const handleChangeRole = async () => {
    if (!memberToChangeRole) return

    setChangingRole(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/organizations/${organization?.id}/members/${memberToChangeRole.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: newRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role')
      }

      showToast('success', `Role changed to ${ROLE_LABELS[newRole]}`)
      setMemberToChangeRole(null)
      setNewRole('developer')
      fetchOrganization() // Refresh members list
    } catch (err: any) {
      console.error('Error changing role:', err)
      showToast('error', err.message || 'Failed to change role')
    } finally {
      setChangingRole(false)
    }
  }

  const handleResendInvitation = async (email: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/organizations/${organization?.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          role: 'developer', // Default role, will use existing invitation role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation')
      }

      showToast('success', `Invitation resent to ${email}`)
    } catch (err: any) {
      console.error('Error resending invitation:', err)
      showToast('error', err.message || 'Failed to resend invitation')
    }
  }

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
  const allMembers = [
    {
      user_id: organization.owner_id,
      name: 'Owner',
      email: `ID: ${organization.owner_id}`,
      role: 'owner' as Role,
      status: 'accepted' as const,
      isOwner: true,
    },
    ...(organization.members?.map(m => ({
      ...m,
      isOwner: false,
    })) || []),
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/organizations/${organization.slug}`}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-slate-600" />
                  <h1 className="text-2xl font-bold text-slate-900">Team Settings</h1>
                </div>
                <p className="text-slate-600 mt-1">{organization.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Members Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
              <p className="text-sm text-slate-600 mt-1">
                Manage who has access to this organization
              </p>
            </div>
            {canManageMembers() && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
              >
                <Mail className="w-4 h-4" />
                Invite Member
              </button>
            )}
          </div>

          <div className="space-y-2">
            {allMembers.map((member) => (
              <div
                key={member.user_id}
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

                  {/* Action menu for non-owners when user has permission */}
                  {!member.isOwner && (canManageMembers() || canManageUsers()) && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === member.user_id ? null : (member.user_id ?? null))
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>

                      {activeMenu === member.user_id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-10">
                          <div className="py-1">
                            {canManageUsers() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenu(null)
                                  setMemberToChangeRole({
                                    userId: member.user_id!,
                                    name: member.name,
                                    currentRole: member.role as Role,
                                  })
                                  setNewRole(member.role as Role)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Shield className="w-4 h-4" />
                                Change Role
                              </button>
                            )}
                            {member.status === 'pending' && canManageMembers() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenu(null)
                                  handleResendInvitation(member.email)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Resend Invitation
                              </button>
                            )}
                            {canManageUsers() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenu(null)
                                  setMemberToDelete(member.user_id!)
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
        </div>
      </main>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Invite Team Member</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleInviteMember}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
                    >
                      {canManageUsers() ? (
                        <>
                          <option value="admin">Admin - Can manage projects, services, and API keys</option>
                          <option value="developer">Developer - Can view logs and use services</option>
                          <option value="viewer">Viewer - Read-only access</option>
                        </>
                      ) : (
                        <>
                          <option value="developer">Developer - Can view logs and use services</option>
                          <option value="viewer">Viewer - Read-only access</option>
                        </>
                      )}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {ROLE_DESCRIPTIONS[inviteRole]}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    disabled={inviting}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Role Modal */}
      <AnimatePresence>
        {memberToChangeRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setMemberToChangeRole(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Change Role</h2>
                <button
                  onClick={() => setMemberToChangeRole(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <p className="text-slate-600 mb-4">
                Change <span className="font-medium text-slate-900">{memberToChangeRole.name}</span>'s role
              </p>

              <div className="space-y-2 mb-6">
                {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([role, label]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setNewRole(role)}
                    className={`w-full p-3 rounded-lg border text-left transition ${
                      newRole === role
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(role)}`}>
                            {label}
                          </span>
                          {newRole === role && (
                            <Check className="w-4 h-4 text-emerald-700" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{ROLE_DESCRIPTIONS[role]}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToChangeRole(null)}
                  disabled={changingRole}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangeRole}
                  disabled={changingRole || newRole === memberToChangeRole.currentRole}
                  className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingRole ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Change Role
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Member Confirmation Modal */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setMemberToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Remove Member?</h2>
              </div>

              <p className="text-slate-600 mb-6">
                This member will lose access to all organization resources. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(memberToDelete)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove Member
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
