/**
 * Organization Detail Page - Organization Details Component
 */

import { Calendar } from 'lucide-react'
import type { Organization } from '../types'
import { formatDate } from '../utils'

interface OrganizationDetailsProps {
  organization: Organization
}

export function OrganizationDetails({ organization }: OrganizationDetailsProps) {
  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization Details</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-slate-500">Organization ID</dt>
          <dd className="mt-1 text-sm text-slate-900 font-mono">{organization.id}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Created</dt>
          <dd className="mt-1 text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(organization.created_at)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
