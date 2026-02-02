'use client'

/**
 * Organization Detail Page - Main Component
 *
 * @deprecated This file has been refactored into a module structure.
 * Please use './organization-detail-page' instead.
 */

import { useParams } from 'next/navigation'
import { useOrganizationData } from './hooks/use-organization-data'
import {
  Header,
  LoadingState,
  NotFoundState,
  ProjectsSection,
  MembersSection,
  OrganizationDetails,
  ToastNotifications,
} from './components'

export default function OrganizationDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const {
    organization,
    projects,
    loading,
    toasts,
    setToasts,
  } = useOrganizationData(slug)

  if (loading) {
    return <LoadingState />
  }

  if (!organization) {
    return <NotFoundState />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header organization={organization} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectsSection projects={projects} />
          <MembersSection organization={organization} />
        </div>
        <OrganizationDetails organization={organization} />
      </main>

      <ToastNotifications toasts={toasts} />
    </div>
  )
}
