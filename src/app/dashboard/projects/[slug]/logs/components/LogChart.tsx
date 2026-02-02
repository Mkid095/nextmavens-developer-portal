/**
 * LogChart Component
 *
 * Chart display component for visualizing log data with group-by options.
 */

'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import type { ChartData, ChartGroupBy } from '../types'
import { SimpleBarChart } from './SimpleBarChart'

interface LogChartProps {
  chartData: ChartData | null
  chartLoading: boolean
  chartGroupBy: ChartGroupBy
  onGroupByChange: (value: ChartGroupBy) => void
  showCharts: boolean
  onShowChartsChange: (value: boolean) => void
}

export function LogChart({
  chartData,
  chartLoading,
  chartGroupBy,
  onGroupByChange,
  showCharts,
  onShowChartsChange,
}: LogChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Log Volume Chart</h2>
          {chartData && (
            <span className="text-sm text-slate-500">({chartData.totalLogs} logs)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Group By Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Group by:</span>
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => onGroupByChange('level')}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  chartGroupBy === 'level'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Level
              </button>
              <button
                onClick={() => onGroupByChange('service')}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  chartGroupBy === 'service'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Service
              </button>
            </div>
          </div>
          {/* Show/Hide Toggle */}
          <button
            onClick={() => onShowChartsChange(!showCharts)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            {showCharts ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {showCharts && (
        <div className="mt-4">
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
              <span className="ml-2 text-slate-600">Loading chart data...</span>
            </div>
          ) : chartData ? (
            <SimpleBarChart data={chartData} groupBy={chartGroupBy} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No chart data available
            </div>
          )}
        </div>
      )}

      {/* Chart Legend */}
      {showCharts && chartData && chartData.data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Time range:</span>
              <span className="text-slate-900 font-medium">
                {new Date(chartData.timeRange.start).toLocaleString()} -{' '}
                {new Date(chartData.timeRange.end).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
