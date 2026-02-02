/**
 * Organizations Page - Module - Constants
 */

import type { RoleBadgeColor } from './types'

export const ROLE_BADGE_COLORS: Record<string, RoleBadgeColor> = {
  owner: { className: 'bg-purple-100 text-purple-800 border-purple-200' },
  admin: { className: 'bg-blue-100 text-blue-800 border-blue-200' },
  developer: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  viewer: { className: 'bg-slate-100 text-slate-800 border-slate-200' },
  default: { className: 'bg-slate-100 text-slate-800 border-slate-200' },
}

export const TOAST_DURATION = 5000

export const INITIAL_FORM_STATE = {
  orgName: '',
  orgSlug: '',
  submitting: false,
  error: '',
}
