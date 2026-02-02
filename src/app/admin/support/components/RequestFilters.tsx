/**
 * Request Filters Component
 * Filter and search controls for support requests
 */

import { Filter, Search } from 'lucide-react'
import type { Status } from '../types'

interface RequestFiltersProps {
  selectedStatus: Status
  onStatusChange: (status: Status) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function RequestFilters({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
}: RequestFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedStatus === status.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject, email, or project..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
