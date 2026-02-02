/**
 * Organizations Page - Module - Utilities
 */

import type { UserRole } from './types'
import { ROLE_BADGE_COLORS } from './constants'

export function getRoleBadgeColor(role?: UserRole): string {
  const key = role || 'default'
  return ROLE_BADGE_COLORS[key]?.className || ROLE_BADGE_COLORS.default.className
}
