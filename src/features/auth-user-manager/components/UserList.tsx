'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { EndUser, UserFilters, UserSort } from '@/lib/types/user.types'
import { UserFilters as UserFiltersComponent } from './UserFilters'
import { UserTable } from './UserTable'
import { UserListStates } from './UserListStates'
import { Pagination } from '@/features/audit-logs/Pagination'

interface UserListProps {
  initialFilters?: UserFilters
  initialSort?: UserSort
}

export function UserList({ initialFilters, initialSort }: UserListProps) {
  const [users, setUsers] = useState<EndUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [total, setTotal] = useState(0)
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<UserFilters>(
    initialFilters || {
      search: '',
      status: '',
      authProvider: '',
      createdAfter: '',
      createdBefore: '',
      lastSignInAfter: '',
      lastSignInBefore: '',
    }
  )

  // Sort state
  const [sort, setSort] = useState<UserSort>(
    initialSort || {
      column: 'created_at',
      direction: 'desc',
    }
  )

  // UI state
  const [showFilters, setShowFilters] = useState(false)

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.authProvider) params.append('auth_provider', filters.authProvider)
      if (filters.createdAfter) params.append('created_after', filters.createdAfter)
      if (filters.createdBefore) params.append('created_before', filters.createdBefore)
      if (filters.lastSignInAfter) params.append('last_sign_in_after', filters.lastSignInAfter)
      if (filters.lastSignInBefore) params.append('last_sign_in_before', filters.lastSignInBefore)
      if (sort.column) params.append('sort_by', sort.column)
      if (sort.direction) params.append('sort_order', sort.direction)

      const response = await fetch(`/api/auth/users?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setTotal(data.total)
      setHasMore(data.pagination.has_more)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and when filters/sort/pagination change
  useEffect(() => {
    fetchUsers()
  }, [offset, sort])

  const handleApplyFilters = () => {
    setOffset(0)
    fetchUsers()
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      authProvider: '',
      createdAfter: '',
      createdBefore: '',
      lastSignInAfter: '',
      lastSignInBefore: '',
    })
    setOffset(0)
  }

  const handleSort = (column: UserSort['column']) => {
    if (sort.column === column) {
      setSort({
        column,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      })
    } else {
      setSort({
        column,
        direction: 'asc',
      })
    }
  }

  return (
    <div className="space-y-4">
      <UserFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        showFilters={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      <UserListStates
        loading={loading}
        error={error}
        userCount={users.length}
        onRetry={fetchUsers}
      />

      {users.length > 0 && (
        <>
          <UserTable users={users} sort={sort} onSort={handleSort} />

          {loading && users.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 px-6 py-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                <span className="text-sm text-slate-600">Loading...</span>
              </div>
            </div>
          )}

          <Pagination
            total={total}
            limit={limit}
            offset={offset}
            hasMore={hasMore}
            onPageChange={setOffset}
          />
        </>
      )}
    </div>
  )
}
