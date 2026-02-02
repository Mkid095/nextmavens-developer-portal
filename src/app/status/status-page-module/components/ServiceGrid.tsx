/**
 * Status Page - Module - Service Grid Component
 */

import { motion } from 'framer-motion'
import type { ServiceStatus } from '../types'
import { SERVICE_LABELS, STATUS_CONFIG } from '../constants'

interface ServiceGridProps {
  services: ServiceStatus[]
}

export function ServiceGrid({ services }: ServiceGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Service Status
      </h2>
      <div className="grid gap-4">
        {services.map((service, index) => {
          const config = STATUS_CONFIG[service.status]
          const Icon = config.icon

          return (
            <motion.div
              key={service.service}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {SERVICE_LABELS[service.service] || service.service}
                  </h3>
                  {service.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {service.message}
                    </p>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
