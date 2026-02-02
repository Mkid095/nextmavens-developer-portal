/**
 * Organizations Page - Module - Organization List Component
 */

import { OrganizationCard } from './OrganizationCard'
import type { Organization } from '../types'

interface OrganizationListProps {
  organizations: Organization[]
}

export function OrganizationList({ organizations }: OrganizationListProps) {
  return (
    <div className="grid gap-4">
      {organizations.map((org) => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </div>
  )
}
