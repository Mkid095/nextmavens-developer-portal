/**
 * Status Page - Module - Incident History Component
 */

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { Incident } from '../types'

interface IncidentHistoryProps {
  incidents: Incident[]
}

export function IncidentHistory({ incidents }: IncidentHistoryProps) {
  if (incidents.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Incident History (Last 7 Days)
      </h2>
      <div className="space-y-3">
        {incidents.map((incident) => (
          <motion.div
            key={incident.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  {incident.title}
                </h3>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(incident.resolved_at!).toLocaleString()}
              </span>
            </div>
            {incident.description && (
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 ml-6">
                {incident.description}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
