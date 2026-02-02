/**
 * Status Page - Module - Main View Component
 */

'use client'

import {
  LoadingState,
  StatusHeader,
  ErrorBanner,
  ServiceGrid,
  ActiveIncidents,
  IncidentHistory,
  StatusFooter,
} from './components'
import { useStatusData, useIncidentFilter } from './hooks'

export function StatusView() {
  const { statusData, loading, error, lastRefresh, fetchStatus } = useStatusData()
  const { activeIncidents, resolvedIncidents } = useIncidentFilter(statusData)

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <StatusHeader statusData={statusData} />
        <ErrorBanner error={error} />

        {statusData && (
          <>
            <ServiceGrid services={statusData.services} />
            <ActiveIncidents incidents={activeIncidents} />
            <IncidentHistory incidents={resolvedIncidents} />
            <StatusFooter lastRefresh={lastRefresh} onRefresh={fetchStatus} />
          </>
        )}
      </div>
    </div>
  )
}
