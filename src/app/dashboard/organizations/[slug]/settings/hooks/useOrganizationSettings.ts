/**
 * Organization Settings Hook
 * Custom hook for organization management logic
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Organization, Role, Toast, MemberToChangeRole } from '../types'
import { createToast, canManageMembers, canManageUsers } from '../utils'
import { ROLE_LABELS } from '../constants'

export function useOrganizationSettings() {
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
  const [memberToChangeRole, setMemberToChangeRole] = useState<MemberToChangeRole | null>(null)
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
    const toast = createToast(type, message)
    setToasts(prev => [...prev, toast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 5000)
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
      fetchOrganization()
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
      fetchOrganization()
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
      fetchOrganization()
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
          role: 'developer',
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

  return {
    // State
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

    // Setters
    setInviteEmail,
    setInviteRole,
    setShowInviteModal,
    setMemberToDelete,
    setMemberToChangeRole,
    setNewRole,
    setActiveMenu,
    setToasts,

    // Handlers
    handleInviteMember,
    handleRemoveMember,
    handleChangeRole,
    handleResendInvitation,
    fetchOrganization,

    // Helpers
    canManageMembers: canManageMembers(organization?.user_role),
    canManageUsers: canManageUsers(organization?.user_role),
  }
}
