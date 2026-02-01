import Link from 'next/link'
import { ArrowLeft, LifeBuoy } from 'lucide-react'
import ProjectStatusBadge from '@/components/ProjectStatusBadge'
import type { Project } from '../types'

interface ProjectHeaderProps {
  project: Project
  onOpenSupport: () => void
}

export function ProjectHeader({ project, onOpenSupport }: ProjectHeaderProps) {
  const getEnvironmentBadge = () => {
    if (!project.environment) return null

    const styles = {
      prod: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      dev: 'bg-blue-100 text-blue-800 border border-blue-200',
      staging: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    }

    const labels = {
      prod: 'Production',
      dev: 'Development',
      staging: 'Staging',
    }

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[project.environment]}`}>
        {labels[project.environment]}
      </span>
    )
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-900">{project.name}</h1>
                {project.status && <ProjectStatusBadge status={project.status} size="sm" />}
                {getEnvironmentBadge()}
              </div>
              <p className="text-xs text-slate-500">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSupport}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            title="Request Support"
          >
            <LifeBuoy className="w-4 h-4" />
            <span className="text-sm font-medium">Support</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
