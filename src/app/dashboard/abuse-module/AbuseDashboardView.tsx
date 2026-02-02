/**
 * Abuse Dashboard - Main View Component
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useDashboardData } from './hooks'
import { Navigation, Header, ErrorMessage, LoadingState, DashboardContent } from './components'
import type { TimeRange } from './types'

export function AbuseDashboardView() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  const { dashboardData, loading, refreshing, error, handleRefresh } = useDashboardData(timeRange)

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <Navigation onLogout={handleLogout} />

      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Header timeRange={timeRange} onTimeRangeChange={setTimeRange} onRefresh={handleRefresh} refreshing={refreshing} />

          {error && <ErrorMessage error={error} />}

          {dashboardData && <DashboardContent dashboardData={dashboardData} />}
        </motion.div>
      </main>
    </div>
  )
}
