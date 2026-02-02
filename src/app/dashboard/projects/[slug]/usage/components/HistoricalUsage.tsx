/**
 * Historical Usage Component
 * Displays historical usage chart with time series data
 */

'use client'

import { formatNumber } from '../utils'
import { aggregateTimeSeries } from '../utils'
import type { TimeSeriesEntry } from '../types'

interface HistoricalUsageProps {
  timeSeries: TimeSeriesEntry[]
}

export function HistoricalUsage({ timeSeries }: HistoricalUsageProps) {
  const aggregatedData = aggregateTimeSeries(timeSeries).slice(0, 14).reverse()
  const maxValue = Math.max(...timeSeries.map((e) => e.quantity), 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Historical Usage
        </h2>
      </div>
      <div className="p-6">
        {timeSeries.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No time series data available for this period
          </p>
        ) : (
          <div className="space-y-4">
            {aggregatedData.map((entry) => {
              const percentage = (entry.total / maxValue) * 100

              return (
                <div key={entry.period} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(entry.period).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatNumber(entry.total)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
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
