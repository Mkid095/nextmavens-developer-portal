'use client'

import { Cpu, AlertTriangle, Shield, Eye, Edit3 } from 'lucide-react'
import { ApiKey, McpAccessLevel } from '@/lib/types/api-key.types'

interface McpTokenBadgeProps {
  apiKey: ApiKey
  compact?: boolean
}

/**
 * US-010: Add MCP Token Indicators in UI
 *
 * Badge component that displays MCP token type with appropriate colors and warnings.
 *
 * Acceptance Criteria:
 * - MCP tokens marked in keys list with badge showing type
 * - Badge showing type (read-only, write, admin)
 * - Different color for each type (blue, amber, red)
 * - Warning icon for write/admin tokens
 */
export function McpTokenBadge({ apiKey, compact = false }: McpTokenBadgeProps) {
  // Check if this is an MCP token
  if (apiKey.key_type !== 'mcp') {
    return null
  }

  // Extract MCP access level from key_prefix
  const getMcpAccessLevel = (): McpAccessLevel => {
    const prefix = apiKey.key_prefix.toLowerCase()
    if (prefix.startsWith('mcp_admin_')) return 'admin'
    if (prefix.startsWith('mcp_rw_')) return 'rw'
    return 'ro'
  }

  const accessLevel = getMcpAccessLevel()

  // Configuration for each access level
  const config = {
    ro: {
      label: 'Read Only',
      shortLabel: 'RO',
      description: 'Can only read data',
      icon: Eye,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      dotColor: 'bg-blue-500',
    },
    rw: {
      label: 'Read/Write',
      shortLabel: 'RW',
      description: 'Can read and modify data',
      icon: Edit3,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
      dotColor: 'bg-amber-500',
    },
    admin: {
      label: 'Admin',
      shortLabel: 'Admin',
      description: 'Full access including delete',
      icon: Shield,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      dotColor: 'bg-red-500',
    },
  }

  const { label, shortLabel, description, icon: Icon, bgColor, borderColor, textColor, dotColor } = config[accessLevel]
  const showWarning = accessLevel === 'rw' || accessLevel === 'admin'
  const WarningIcon = AlertTriangle

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${bgColor} ${borderColor} ${textColor}`}
        title={`MCP Token: ${label} - ${description}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-xs font-medium">{shortLabel}</span>
        {showWarning && <WarningIcon className="w-3 h-3" />}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-lg border ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-1.5">
        <Cpu className={`w-3.5 h-3.5 ${textColor}`} />
        <span className={`text-xs font-medium ${textColor}`}>MCP</span>
        <div className={`w-1 h-1 rounded-full ${dotColor}`} />
        <span className={`text-xs font-medium ${textColor}`}>{shortLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${textColor}`} />
      </div>
      {showWarning && (
        <WarningIcon className={`w-3.5 h-3.5 ${textColor}`} title={description} />
      )}
    </div>
  )
}
