/**
 * Usage Header Component
 * Header with navigation, title, and controls
 */

'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, RefreshCw, Download } from 'lucide-react'
import type { UsageResponse, Project, AggregationType } from '../types'

interface UsageHeaderProps {
  projectSlug: string
  project: Project | null
  usageData: UsageResponse | null
  aggregation: AggregationType
  setAggregation: (value: AggregationType) => void
  days: number
  setDays: (value: number) => void
  refreshing: boolean
  onRefresh: () => void
  onExport: () => void
}

export function UsageHeader({
  projectSlug,
  project,
  usageData,
  aggregation,
  setAggregation,
  days,
  setDays,
  refreshing,
  onRefresh,
  onExport,
}: UsageHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/projects/${projectSlug}`}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Usage Dashboard
              </h1>
              {project && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Aggregation Selector */}
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>

            {/* Days Selector */}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!usageData}
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Period Info */}
        {usageData && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(usageData.period.start_date).toLocaleDateString()} -{' '}
              {new Date(usageData.period.end_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
