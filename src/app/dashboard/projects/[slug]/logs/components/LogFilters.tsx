/**
 * LogFilters Component
 *
 * Main filter controls container for logs page.
 * Composed of smaller filter components.
 */

'use client'

import React from 'react'
import type { ServiceFilter, LevelFilter, DateRangeFilter, DownloadFormat } from '../types'
import { FilterBar } from './FilterBar'
import { CustomDateRange } from './CustomDateRange'
import { DownloadSection } from './DownloadSection'
import { FilterResults } from './FilterResults'

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
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      {/* Filter Bar - Search and filter dropdowns */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        serviceFilter={serviceFilter}
        onServiceChange={onServiceChange}
        levelFilter={levelFilter}
        onLevelChange={onLevelChange}
        dateRangeFilter={dateRangeFilter}
        onDateRangeChange={onDateRangeChange}
      />

      {/* Download Section */}
      <div className="mt-4 flex justify-end">
        <DownloadSection
          downloadFormat={downloadFormat}
          onDownloadFormatChange={onDownloadFormatChange}
          onDownload={onDownload}
          isDownloading={isDownloading}
          downloadSuccess={downloadSuccess}
          disabled={filteredLogsCount === 0}
        />
      </div>

      {/* Custom Date Range Inputs */}
      {dateRangeFilter === 'custom' && (
        <CustomDateRange
          startDate={customStartDate}
          onStartDateChange={onCustomStartDateChange}
          endDate={customEndDate}
          onEndDateChange={onCustomEndDateChange}
        />
      )}

      {/* Results Count and Load More */}
      <FilterResults
        filteredCount={filteredLogsCount}
        totalCount={totalLogCount}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />
    </div>
  )
}
