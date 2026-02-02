/**
 * Organization Settings Types
 * Type definitions for organization settings page
 */

export type Role = 'owner' | 'admin' | 'developer' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  user_role?: Role
  created_at: string
  members?: Member[]
}

export interface Member {
  id?: string
  user_id?: string
  name: string
  email: string
  role: string
  status?: 'pending' | 'accepted'
  joined_at?: string
  invited_by?: string
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export interface ExtendedMember extends Member {
  isOwner: boolean
}

export interface MemberToChangeRole {
  userId: string
  name: string
  currentRole: Role
}
