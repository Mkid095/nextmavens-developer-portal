/**
 * Organization Settings Constants
 * Role labels and descriptions
 */

import type { Role } from '../types'

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  developer: 'Developer',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full access to all organization resources and settings',
  admin: 'Can manage projects, services, and API keys',
  developer: 'Can view logs and use services',
  viewer: 'Read-only access to logs and resources',
}
