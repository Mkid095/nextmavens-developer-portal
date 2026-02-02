/**
 * CustomDateRange Component
 *
 * Custom date range input fields for logs filtering.
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface CustomDateRangeProps {
  startDate: string
  onStartDateChange: (value: string) => void
  endDate: string
  onEndDateChange: (value: string) => void
}

export function CustomDateRange({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: CustomDateRangeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4"
    >
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
        />
      </div>
    </motion.div>
  )
}
