/**
 * Project Types Module - MCP Token Types (US-010)
 */

import type { LucideIcon } from 'lucide-react'
import { Key, EyeOff as EyeOffIcon, Edit3, Lock, Server } from 'lucide-react'

/**
 * MCP token information display
 */
export interface McpTokenInfo {
  isMcp: boolean
  label: string
  bgColor: string
  textColor: string
  icon: LucideIcon
  showWarning: boolean
}

/**
 * Get MCP token display information based on key prefix and type
 */
export function getMcpTokenInfo(keyPrefix: string, keyType: string): McpTokenInfo {
  // Check if this is an MCP token
  if (keyType !== 'mcp' || !keyPrefix.startsWith('mcp_')) {
    return {
      isMcp: false,
      label: keyType,
      bgColor: 'bg-slate-200',
      textColor: 'text-slate-700',
      icon: Key,
      showWarning: false,
    }
  }

  // Extract MCP access level from prefix (mcp_ro_, mcp_rw_, mcp_admin_)
  const match = keyPrefix.match(/^mcp_(ro|rw|admin)_/)
  const accessLevel = match ? match[1] : 'ro'

  switch (accessLevel) {
    case 'ro':
      return {
        isMcp: true,
        label: 'MCP Read-Only',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: EyeOffIcon,
        showWarning: false,
      }
    case 'rw':
      return {
        isMcp: true,
        label: 'MCP Read-Write',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: Edit3,
        showWarning: true,
      }
    case 'admin':
      return {
        isMcp: true,
        label: 'MCP Admin',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: Lock,
        showWarning: true,
      }
    default:
      return {
        isMcp: true,
        label: 'MCP',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-700',
        icon: Server,
        showWarning: false,
      }
  }
}
