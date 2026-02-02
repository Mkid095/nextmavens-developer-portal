/**
 * Organizations Page - Module - Organization Card Component
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, FolderOpen, ChevronRight } from 'lucide-react'
import type { Organization } from '../types'
import { getRoleBadgeColor } from '../utils'

interface OrganizationCardProps {
  organization: Organization
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Link
      href={`/dashboard/organizations/${organization.slug}`}
      className="block"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-900 transition">
                {organization.name}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(organization.user_role)}`}>
                {organization.user_role || 'member'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              @{organization.slug}
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{organization.member_count} member{organization.member_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>{organization.project_count} project{organization.project_count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-900 transition" />
        </div>
      </motion.div>
    </Link>
  )
}
