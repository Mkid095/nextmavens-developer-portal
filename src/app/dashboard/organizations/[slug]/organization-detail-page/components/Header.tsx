/**
 * Organization Detail Page - Header Component
 */

import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import type { Organization } from '../types'
import { getRoleBadgeColor } from '../utils'

interface HeaderProps {
  organization: Organization
}

export function Header({ organization }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/organizations"
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{organization.name}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(organization.user_role || 'viewer')}`}>
                  {organization.user_role || 'viewer'}
                </span>
              </div>
              <p className="text-slate-600 mt-1">@{organization.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/organizations/${organization.slug}/settings`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
