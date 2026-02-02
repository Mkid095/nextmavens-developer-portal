/**
 * FilterBar Component
 *
 * Search and filter controls for logs page.
 */

'use client'

import React from 'react'
import { Search, X } from 'lucide-react'
import type { ServiceFilter, LevelFilter, DateRangeFilter } from '../types'
import { serviceOptions, levelOptions, dateRangeOptions } from '../constants'
import { FilterDropdown } from './FilterDropdown'

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  serviceFilter: ServiceFilter
  onServiceChange: (value: ServiceFilter) => void
  levelFilter: LevelFilter
  onLevelChange: (value: LevelFilter) => void
  dateRangeFilter: DateRangeFilter
  onDateRangeChange: (value: DateRangeFilter) => void
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  serviceFilter,
  onServiceChange,
  levelFilter,
  onLevelChange,
  dateRangeFilter,
  onDateRangeChange,
}: FilterBarProps) {
  return (
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
      <FilterDropdown
        options={serviceOptions}
        value={serviceFilter}
        onChange={onServiceChange}
        minWidth="160px"
      />

      {/* Level Filter */}
      <FilterDropdown
        options={levelOptions}
        value={levelFilter}
        onChange={onLevelChange}
        minWidth="140px"
      />

      {/* Date Range Filter */}
      <FilterDropdown
        options={dateRangeOptions}
        value={dateRangeFilter}
        onChange={onDateRangeChange}
        icon={({ className }) => <span className={className}>📅</span>}
        minWidth="160px"
      />
    </div>
  )
}
