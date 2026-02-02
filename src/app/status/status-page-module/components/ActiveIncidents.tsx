/**
 * Status Page - Module - Active Incidents Component
 */

import { motion } from 'framer-motion'
import { AlertCircle, Clock } from 'lucide-react'
import type { Incident } from '../types'
import { IMPACT_LABELS } from '../constants'

interface ActiveIncidentsProps {
  incidents: Incident[]
}

export function ActiveIncidents({ incidents }: ActiveIncidentsProps) {
  if (incidents.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Active Incidents
      </h2>
      <div className="space-y-4">
        {incidents.map((incident) => (
          <motion.div
            key={incident.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {incident.title}
                </h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                {IMPACT_LABELS[incident.impact] || incident.impact}
              </span>
            </div>
            {incident.description && (
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 ml-7">
                {incident.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 ml-7 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Started {new Date(incident.started_at).toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
