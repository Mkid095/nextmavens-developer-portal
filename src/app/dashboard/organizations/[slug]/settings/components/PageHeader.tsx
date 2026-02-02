/**
 * Page Header Component
 * Header for organization settings page
 */

'use client'

import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import type { Organization } from '../types'

interface PageHeaderProps {
  organization: Organization
}

export function PageHeader({ organization }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/organizations/${organization.slug}`}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-slate-600" />
                <h1 className="text-2xl font-bold text-slate-900">Team Settings</h1>
              </div>
              <p className="text-slate-600 mt-1">{organization.name}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
