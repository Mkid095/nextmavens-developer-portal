/**
 * Page States Components
 * Loading and error state components for the project detail page
 */

'use client'

interface PageStatesProps {
  projectLoading: boolean
  project: unknown
  projectError: string | undefined
}

export function LoadingState() {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600">Loading project...</span>
      </div>
    </div>
  )
}

export function ErrorState({ projectError }: { projectError?: string }) {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 mb-2">Project not found</p>
        {projectError && <p className="text-sm text-red-600 mb-4">{projectError}</p>}
        <a href="/dashboard" className="text-emerald-700 hover:text-emerald-800">
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}
