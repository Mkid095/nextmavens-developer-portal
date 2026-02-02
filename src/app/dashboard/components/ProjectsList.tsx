/**
 * Projects List Component
 *
 * Displays the list of projects with filter and restore functionality.
 */

'use client'

import Link from 'next/link'
import { Database, Trash2, RefreshCw, Calendar } from 'lucide-react'
import ProjectStatusBadge from '@/components/ProjectStatusBadge'
import type { Project, ProjectFilter } from '../types'

interface ProjectsListProps {
  projects: Project[]
  deletedProjects: Project[]
  projectFilter: ProjectFilter
  onFilterChange: (filter: ProjectFilter) => void
  onCreateClick: () => void
  onRestore: (projectId: string, projectName: string) => void
}

export function ProjectsList({
  projects,
  deletedProjects,
  projectFilter,
  onFilterChange,
  onCreateClick,
  onRestore,
}: ProjectsListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFilterChange('active')}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition ${
              projectFilter === 'active'
                ? 'bg-emerald-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Active ({projects.length})
          </button>
          <button
            onClick={() => onFilterChange('deleted')}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition ${
              projectFilter === 'deleted'
                ? 'bg-red-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Deleted ({deletedProjects.length})
          </button>
          {projectFilter === 'active' && (
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 text-sm bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Project
            </button>
          )}
        </div>
      </div>
      <div className="p-6 space-y-4">
        {projectFilter === 'active' ? (
          projects.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">No projects yet. Create one to get started.</p>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{project.name}</span>
                    {project.status && <ProjectStatusBadge status={project.status} size="sm" />}
                    {project.environment && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          project.environment === 'prod'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : project.environment === 'dev'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}
                      >
                        {project.environment === 'prod'
                          ? 'Prod'
                          : project.environment === 'dev'
                            ? 'Dev'
                            : 'Staging'}
                      </span>
                    )}
                  </div>
                  <code className="text-xs text-slate-500">{project.slug}</code>
                </div>
                <Link
                  href={`/dashboard/projects/${project.slug}`}
                  className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Open
                </Link>
              </div>
            ))
          )
        ) : (
          deletedProjects.length === 0 ? (
            <div className="text-center py-8">
              <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No deleted projects.</p>
            </div>
          ) : (
            deletedProjects.map((project) => (
              <div key={project.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{project.name}</div>
                    <code className="text-xs text-slate-500">{project.slug}</code>
                  </div>
                  <button
                    onClick={() => onRestore(project.id, project.name)}
                    className="flex items-center gap-2 text-sm bg-emerald-700 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Restore
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Deleted: {project.deleted_at ? new Date(project.deleted_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  {project.recoverable_until && (
                    <div className="flex items-center gap-1">
                      <span>Recoverable until: {new Date(project.recoverable_until).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
