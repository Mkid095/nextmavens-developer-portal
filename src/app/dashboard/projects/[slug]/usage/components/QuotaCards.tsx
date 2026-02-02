/**
 * Quota Cards Component
 * Displays quota overview cards with progress bars
 */

'use client'

import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { SERVICE_CONFIG } from '../constants'
import { getServiceIcon, getServiceColor, getUsageColor } from '../utils'
import type { QuotaInfo } from '../types'

interface QuotaCardsProps {
  quotas: QuotaInfo[]
}

export function QuotaCards({ quotas }: QuotaCardsProps) {
  if (quotas.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {quotas.map((quota) => {
        const Icon = getServiceIcon(quota.service)
        const color = getServiceColor(quota.service)
        const usageColor = getUsageColor(quota.usage_percentage)

        return (
          <div
            key={quota.service}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 bg-${color}-100 dark:bg-${color}-900 rounded-lg`}
                >
                  <Icon
                    className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {SERVICE_CONFIG[quota.service]?.label || quota.service}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Resets {new Date(quota.reset_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center space-x-1 text-${usageColor}-600 dark:text-${usageColor}-400`}
              >
                {quota.usage_percentage >= 70 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {quota.usage_percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {quota.current_usage.toLocaleString()} /{' '}
                  {quota.monthly_limit.toLocaleString()}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {quota.hard_cap.toLocaleString()} cap
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full bg-${usageColor}-500 transition-all duration-500`}
                  style={{ width: `${Math.min(quota.usage_percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Status Indicator */}
            {quota.usage_percentage >= 90 ? (
              <div className="mt-4 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Approaching limit</span>
              </div>
            ) : quota.usage_percentage >= 70 ? (
              <div className="mt-4 flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span>Usage elevated</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Within limits</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
