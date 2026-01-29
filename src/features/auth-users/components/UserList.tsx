'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ChevronLeft, ChevronRight, Users, Mail, Calendar, Shield } from 'lucide-react'
import type { EndUser, EndUserListQuery } from '@/lib/types/auth-user.types'
import { getAuthServiceClient } from '@/lib/api/auth-service-client'
import { UserFilterBar } from '@/features/auth-users/components/UserFilterBar'

interface UserListProps {
  initialFilters?: EndUserListQuery
  onViewUser?: (userId: string) => void
}

export function UserList({ initialFilters = {}, onViewUser }: UserListProps) {
  const [users, setUsers] = useState<EndUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EndUserListQuery>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const limit = 50

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const client = getAuthServiceClient()
      if (!client) {
        throw new Error('Auth service client not configured')
      }

      const query: EndUserListQuery = {
        ...filters,
        limit,
        offset: page * limit,
      }

      const response = await client.listEndUsers(query)
      setUsers(response.users)
      setTotal(response.total)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, filters])

  const handleFiltersChange = (newFilters: EndUserListQuery) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    setPage(0)
    fetchUsers()
  }

  const handleClearFilters = () => {
    const clearedFilters: EndUserListQuery = {}
    setFilters(clearedFilters)
    setPage(0)
    fetchUsers()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return 'bg-emerald-100 text-emerald-800'
    }
    if (status === 'disabled') {
      return 'bg-amber-100 text-amber-800'
    }
    return 'bg-red-100 text-red-800'
  }

  const getProviderBadge = (provider: string) => {
    if (provider === 'email') return 'bg-blue-100 text-blue-800'
    if (provider === 'google') return 'bg-red-100 text-red-800'
    if (provider === 'github') return 'bg-slate-100 text-slate-800'
    if (provider === 'microsoft') return 'bg-cyan-100 text-cyan-800'
    return 'bg-slate-100 text-slate-800'
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <UserFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        showFilters={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Users List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">
              Users {total > 0 && <span className="text-slate-500">({total.toLocaleString()})</span>}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
              <span className="text-slate-600">Loading users...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600 mb-2">Error loading users</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-1">No users found</p>
            <p className="text-sm text-slate-400">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <div className="col-span-3">User</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-2">Last Sign In</div>
              <div className="col-span-1"></div>
            </div>

            {/* Users List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="divide-y divide-slate-100"
            >
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition"
                >
                  {/* User Info */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-slate-500 truncate" title={user.email}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(user.status)}`}
                    >
                      {user.status}
                    </span>
                  </div>

                  {/* Provider */}
                  <div className="col-span-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getProviderBadge(user.auth_provider)}`}
                    >
                      {user.auth_provider}
                    </span>
                  </div>

                  {/* Created At */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Last Sign In */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{formatDate(user.last_sign_in_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        if (onViewUser) {
                          onViewUser(user.user_id)
                        }
                      }}
                      className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
