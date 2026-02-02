/**
 * Organization Detail Page - Type Definitions
 */

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  user_role?: 'owner' | 'admin' | 'developer' | 'viewer'
  created_at: string
  members?: Array<{
    user_id: string
    name: string
    email: string
    role: string
    joined_at: string
  }>
}

export interface Project {
  id: string
  name: string
  slug: string
  environment: string
  status: string
  created_at: string
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer'
export type ProjectStatus = 'active' | 'suspended' | 'archived'
