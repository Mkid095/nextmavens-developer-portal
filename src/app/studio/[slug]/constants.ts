/**
 * Studio Page Constants
 * Navigation items and other constants
 */

import { Table, Terminal, Users, Shield, Settings } from 'lucide-react'
import type { NavItem } from './types'

export const NAV_ITEMS: NavItem[] = [
  { id: 'tables', label: 'Tables', icon: Table },
  { id: 'sql', label: 'SQL Query', icon: Terminal },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'api-keys', label: 'API Keys', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
]
