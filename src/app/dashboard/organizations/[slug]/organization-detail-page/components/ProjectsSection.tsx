/**
 * Organization Detail Page - Projects Section Component
 */

import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'
import type { Project } from '../types'
import { getStatusBadgeColor } from '../utils'

interface ProjectsSectionProps {
  projects: Project[]
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
        <span className="text-sm text-slate-600">{projects.length} total</span>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No projects in this organization yet</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-emerald-900 font-medium hover:text-emerald-800"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.slug}`}
              className="block p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{project.name}</h3>
                  <p className="text-sm text-slate-500">@{project.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{project.environment}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
