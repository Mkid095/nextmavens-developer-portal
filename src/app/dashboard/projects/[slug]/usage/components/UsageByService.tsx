/**
 * Usage By Service Component
 * Displays usage breakdown by service with metric details
 */

'use client'

import { SERVICE_CONFIG, METRIC_LABELS } from '../constants'
import { getServiceIcon, getServiceColor, formatNumber, formatBytes } from '../utils'
import type { ServiceUsage } from '../types'

interface UsageByServiceProps {
  services: ServiceUsage[]
}

export function UsageByService({ services }: UsageByServiceProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Usage by Service
        </h2>
      </div>
      <div className="p-6">
        {services.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No usage data available for this period
          </p>
        ) : (
          <div className="space-y-6">
            {services.map((serviceUsage) => {
              const Icon = getServiceIcon(serviceUsage.service)
              const color = getServiceColor(serviceUsage.service)

              return (
                <div key={serviceUsage.service} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {SERVICE_CONFIG[serviceUsage.service]?.label ||
                          serviceUsage.service}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatNumber(serviceUsage.total_quantity)}
                    </span>
                  </div>

                  {/* Metric Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-8">
                    {serviceUsage.metric_breakdown.map((metric) => (
                      <div
                        key={metric.metric_type}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {METRIC_LABELS[metric.metric_type] ||
                            metric.metric_type}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          {metric.metric_type === 'storage_bytes'
                            ? formatBytes(metric.quantity)
                            : formatNumber(metric.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
