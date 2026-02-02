/**
 * Organizations Page - Module - Types
 */

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  user_role?: UserRole
  created_at: string
  member_count: number
  project_count: number
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export interface CreateOrganizationFormState {
  orgName: string
  orgSlug: string
  submitting: boolean
  error: string
}

export interface RoleBadgeColor {
  className: string
}
