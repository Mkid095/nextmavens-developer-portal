/**
 * Status Page - Module - Status Header Component
 */

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import type { StatusResponse } from '../types'
import { STATUS_CONFIG } from '../constants'

interface StatusHeaderProps {
  statusData: StatusResponse | null
}

export function StatusHeader({ statusData }: StatusHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <Activity className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          System Status
        </h1>
      </div>
      {statusData && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
          {statusData.overall_status === 'operational' && (
            <STATUS_CONFIG.operational.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          )}
          {statusData.overall_status === 'degraded' && (
            <STATUS_CONFIG.degraded.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
          {statusData.overall_status === 'outage' && (
            <STATUS_CONFIG.outage.icon className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {STATUS_CONFIG[statusData.overall_status].label}
          </span>
        </div>
      )}
    </motion.div>
  )
}
