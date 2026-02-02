/**
 * Organizations Page - Module - Main View Component
 */

'use client'

import { useState } from 'react'
import {
  Header,
  LoadingState,
  EmptyState,
  OrganizationList,
  CreateOrganizationModal,
  ToastNotifications,
} from './components'
import { useOrganizationsData, useCreateOrganization, useToasts } from './hooks'

export function OrganizationsView() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { organizations, loading, fetchOrganizations } = useOrganizationsData()
  const { toasts, showToast } = useToasts()

  const {
    formState,
    setOrgName,
    setOrgSlug,
    handleSubmit,
    resetForm,
  } = useCreateOrganization(
    () => {
      setShowCreateModal(false)
      resetForm()
      fetchOrganizations()
    },
    showToast
  )

  const handleCreateClick = () => setShowCreateModal(true)
  const handleCloseModal = () => {
    setShowCreateModal(false)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onCreateClick={handleCreateClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingState />
        ) : organizations.length === 0 ? (
          <EmptyState onCreateClick={handleCreateClick} />
        ) : (
          <OrganizationList organizations={organizations} />
        )}
      </main>

      <CreateOrganizationModal
        show={showCreateModal}
        formState={formState}
        onOrgNameChange={setOrgName}
        onOrgSlugChange={setOrgSlug}
        onSubmit={handleSubmit}
        onClose={handleCloseModal}
      />

      <ToastNotifications toasts={toasts} />
    </div>
  )
}
