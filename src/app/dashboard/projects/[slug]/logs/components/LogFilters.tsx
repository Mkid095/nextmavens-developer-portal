/**
 * LogFilters Component
 *
 * Filter controls for logs including service, level, date range, and download format.
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  X,
  FileJson,
  FileCode,
} from 'lucide-react'
import type { ServiceFilter, LevelFilter, DateRangeFilter, DownloadFormat } from '../types'
import { serviceOptions, levelOptions, dateRangeOptions } from '../constants'

interface LogFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  serviceFilter: ServiceFilter
  onServiceChange: (value: ServiceFilter) => void
  levelFilter: LevelFilter
  onLevelChange: (value: LevelFilter) => void
  dateRangeFilter: DateRangeFilter
  onDateRangeChange: (value: DateRangeFilter) => void
  customStartDate: string
  onCustomStartDateChange: (value: string) => void
  customEndDate: string
  onCustomEndDateChange: (value: string) => void
  downloadFormat: DownloadFormat
  onDownloadFormatChange: (value: DownloadFormat) => void
  onDownload: () => void
  filteredLogsCount: number
  totalLogCount: number
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  isDownloading: boolean
  downloadSuccess: boolean
}

export function LogFilters({
  searchQuery,
  onSearchChange,
  serviceFilter,
  onServiceChange,
  levelFilter,
  onLevelChange,
  dateRangeFilter,
  onDateRangeChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  downloadFormat,
  onDownloadFormatChange,
  onDownload,
  filteredLogsCount,
  totalLogCount,
  hasMore,
  loadingMore,
  onLoadMore,
  isDownloading,
  downloadSuccess,
}: LogFiltersProps) {
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false)
  const [showDownloadFormatDropdown, setShowDownloadFormatDropdown] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Box */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search logs by message, service, or request ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Service Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowServiceDropdown(!showServiceDropdown)
              setShowLevelDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[160px] justify-between"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm">
              {serviceOptions.find((opt) => opt.value === serviceFilter)?.label}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showServiceDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px]">
              {serviceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onServiceChange(option.value)
                    setShowServiceDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                    serviceFilter === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Level Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLevelDropdown(!showLevelDropdown)
              setShowServiceDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[140px] justify-between"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm">
              {levelOptions.find((opt) => opt.value === levelFilter)?.label}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showLevelDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[140px]">
              {levelOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onLevelChange(option.value)
                    setShowLevelDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                    levelFilter === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDateRangeDropdown(!showDateRangeDropdown)
              setShowServiceDropdown(false)
              setShowLevelDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[160px] justify-between"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm">
              {dateRangeOptions.find((opt) => opt.value === dateRangeFilter)?.label}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDateRangeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[200px]">
              {dateRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onDateRangeChange(option.value)
                    setShowDateRangeDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                    dateRangeFilter === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Download Format Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDownloadFormatDropdown(!showDownloadFormatDropdown)
              setShowServiceDropdown(false)
              setShowLevelDropdown(false)
              setShowDateRangeDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[140px] justify-between"
          >
            {downloadFormat === 'json' ? (
              <FileJson className="w-4 h-4 text-slate-500" />
            ) : (
              <FileCode className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-sm uppercase">{downloadFormat}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDownloadFormatDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[140px]">
              <button
                onClick={() => {
                  onDownloadFormatChange('json')
                  setShowDownloadFormatDropdown(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition flex items-center gap-2 ${
                  downloadFormat === 'json' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => {
                  onDownloadFormatChange('text')
                  setShowDownloadFormatDropdown(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition flex items-center gap-2 ${
                  downloadFormat === 'text' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <FileCode className="w-4 h-4" />
                Text
              </button>
            </div>
          )}
        </div>

        {/* Download Button */}
        <button
          onClick={onDownload}
          disabled={filteredLogsCount === 0 || isDownloading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            filteredLogsCount === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Downloading...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span className="text-sm">Download</span>
            </>
          )}
        </button>
      </div>

      {/* Custom Date Range Inputs */}
      {dateRangeFilter === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
            />
          </div>
        </motion.div>
      )}

      {/* Results Count */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Showing {filteredLogsCount} of {totalLogCount} log entries
        </div>
        <div className="flex items-center gap-3">
          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="text-sm text-emerald-700 hover:text-emerald-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ChevronDownIcon className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Import icons needed for the component
import { CheckCircle, Download, Loader2, ChevronDown as ChevronDownIcon } from 'lucide-react'
