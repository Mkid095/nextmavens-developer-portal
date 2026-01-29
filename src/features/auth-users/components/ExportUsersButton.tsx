'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { getAuthServiceClient } from '@/lib/api/auth-service-client'
import type { EndUserListQuery } from '@/lib/types/auth-user.types'
import { exportUsersToCSV } from '@/features/auth-users/utils/export-users'

interface ExportUsersButtonProps {
  filters?: EndUserListQuery
  className?: string
}

export function ExportUsersButton({ filters = {}, className = '' }: ExportUsersButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const client = getAuthServiceClient()
      if (!client) {
        throw new Error('Auth service client not configured')
      }

      // Fetch all users matching the current filters
      // We use a large limit to get all users (up to 10,000)
      const response = await client.listEndUsers({
        ...filters,
        limit: 10000,
        offset: 0,
      })

      if (response.users.length === 0) {
        setError('No users to export')
        return
      }

      // Export to CSV
      await exportUsersToCSV(response.users)
    } catch (err) {
      console.error('Failed to export users:', err)
      setError(err instanceof Error ? err.message : 'Failed to export users')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`${className} px-4 py-2 bg-emerald-900 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export Users
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
