/**
 * Admin Support Dashboard
 *
 * Admin interface for managing support requests.
 * Lists all open requests with filtering, viewing details, updating status, and adding notes.
 *
 * US-010: Create Admin Support UI
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useSupportRequests } from './hooks/useSupportRequests'
import {
  SupportHeader,
  RequestFilters,
  EmptyState,
  RequestList,
  Pagination,
  RequestDetailModal,
} from './components'
import { PAGE_SIZE } from './constants'

export default function AdminSupportPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  const {
    requests,
    total,
    loading,
    error,
    selectedStatus,
    setSelectedStatus,
    page,
    setPage,
    totalPages,
    fetchRequests,
  } = useSupportRequests()

  const filteredRequests = requests.filter((req) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      req.subject.toLowerCase().includes(query) ||
      req.user_email.toLowerCase().includes(query) ||
      req.project_name.toLowerCase().includes(query)
    )
  })

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request)
  }

  const handleCloseModal = () => {
    setSelectedRequest(null)
  }

  const handleUpdate = () => {
    fetchRequests()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SupportHeader loading={loading} onRefresh={fetchRequests} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RequestFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading / Empty / List */}
        {loading ? (
          <EmptyState loading={true} />
        ) : filteredRequests.length === 0 ? (
          <EmptyState loading={false} message="No support requests found" />
        ) : (
          <>
            <RequestList requests={filteredRequests} onRequestClick={handleRequestClick} />
            <Pagination
              page={page}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
