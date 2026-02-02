'use client'

/**
 * US-007: Create Usage Dashboard
 * prd-usage-tracking.json
 *
 * Displays resource consumption metrics with visual indicators,
 * progress bars, color coding, and historical usage charts.
 */

import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { useUsageData } from './hooks/useUsageData'
import { exportUsageAsCSV } from './utils'
import {
  UsageHeader,
  QuotaCards,
  UsageByService,
  HistoricalUsage,
  LoadingState,
  ErrorState,
} from './components'

export default function UsageDashboardPage() {
  const params = useParams()
  const {
    project,
    usageData,
    loading,
    error,
    refreshing,
    aggregation,
    setAggregation,
    days,
    setDays,
    handleRefresh,
    retry,
  } = useUsageData()

  const handleExport = () => {
    if (usageData) {
      exportUsageAsCSV(usageData.usage.time_series, params.slug as string)
    }
  }

  if (loading && !usageData) {
    return <LoadingState />
  }

  if (error && !usageData) {
    return <ErrorState error={error} onRetry={retry} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UsageHeader
        projectSlug={params.slug as string}
        project={project}
        usageData={usageData}
        aggregation={aggregation}
        setAggregation={setAggregation}
        days={days}
        setDays={setDays}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {usageData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {usageData.quota && usageData.quota.length > 0 && (
              <QuotaCards quotas={usageData.quota} />
            )}

            <UsageByService services={usageData.usage.total_by_service} />

            <HistoricalUsage timeSeries={usageData.usage.time_series} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
