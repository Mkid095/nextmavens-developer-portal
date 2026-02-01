import Link from 'next/link'
import { Database, ChevronRight, Trash2 } from 'lucide-react'
import { ProvisioningProgress } from '@/components/ProvisioningProgress'
import StatusHistory from '@/components/StatusHistory'
import type { Project } from '../types'

interface OverviewTabProps {
  project: Project
  canDeleteProject: boolean
  onDeleteProject: () => void
}

export function OverviewTab({ project, canDeleteProject, onDeleteProject }: OverviewTabProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Project Overview</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-slate-900">Quick Links</h3>
          <Link
            href={`/studio/${project.slug}`}
            className="block p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-700" />
              <div>
                <p className="font-medium text-emerald-900">Open Studio Console</p>
                <p className="text-sm text-emerald-700">Manage database, auth, and storage</p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-700 ml-auto" />
            </div>
          </Link>
        </div>
        <div className="space-y-4">
          <h3 className="font-medium text-slate-900">Project Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Project ID</span>
              <code className="text-sm text-slate-900">{project.id}</code>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Tenant ID</span>
              <code className="text-sm text-slate-900">{project.tenant_id}</code>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Slug</span>
              <code className="text-sm text-slate-900">{project.slug}</code>
            </div>
          </div>
        </div>
      </div>

      {/* US-007: Provisioning Progress */}
      <div className="mt-8">
        <ProvisioningProgress projectId={project.id} projectName={project.name} />
      </div>

      {/* US-009: Status History Section */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <StatusHistory projectId={project.id} />
      </div>

      {/* US-009: Delete Project Section - Only shown to owners */}
      {canDeleteProject && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-900">Danger Zone</h3>
              <p className="text-sm text-slate-600 mt-1">Delete this project and all its data</p>
            </div>
            <button
              onClick={onDeleteProject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete Project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
