/**
 * Permission Banner Component
 * Displays user's SQL query permissions based on RBAC role
 */

import { Shield } from 'lucide-react'
import type { UserRole } from '../types'

interface PermissionBannerProps {
  userRole: UserRole
}

export function PermissionBanner({ userRole }: PermissionBannerProps) {
  const getBannerStyles = () => {
    if (userRole === 'viewer') {
      return {
        container: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
      }
    }
    if (userRole === 'developer') {
      return {
        container: 'bg-amber-50 border-amber-200',
        icon: 'text-amber-600',
      }
    }
    return {
      container: 'bg-emerald-50 border-emerald-200',
      icon: 'text-emerald-600',
    }
  }

  const getPermissionText = () => {
    if (userRole === 'viewer') {
      return <span> • You can only execute <strong>SELECT</strong> queries</span>
    }
    if (userRole === 'developer') {
      return (
        <span> • You can execute <strong>SELECT, INSERT, UPDATE</strong> queries</span>
      )
    }
    return <span> • You have <strong>full access</strong> to all SQL operations</span>
  }

  const styles = getBannerStyles()

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles.container}`}>
      <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">SQL Query Permissions</p>
        <p className="text-xs text-slate-700 mt-1">
          Your role: <strong className="capitalize">{userRole || 'unknown'}</strong>
          {getPermissionText()}
        </p>
      </div>
    </div>
  )
}
