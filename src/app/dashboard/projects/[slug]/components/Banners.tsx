import { AlertCircle } from 'lucide-react'
import SuspensionBanner from '@/components/SuspensionBanner'
import QuotaWarningBanner from '@/components/QuotaWarningBanner'
import type { Project, SuspensionRecord } from '../types'

interface BannersProps {
  project: Project
  suspensionStatus: SuspensionRecord | null
  onRequestSuspensionReview: () => void
}

export function ProjectBanners({ project, suspensionStatus, onRequestSuspensionReview }: BannersProps) {
  return (
    <>
      {/* Suspension Banner */}
      {suspensionStatus && (
        <SuspensionBanner
          suspension={suspensionStatus}
          onRequestReview={onRequestSuspensionReview}
        />
      )}

      {/* Quota Warning Banner - US-005 */}
      <QuotaWarningBanner projectId={project.id} />

      {/* Production Environment Warning Banner - US-009 */}
      {project.environment === 'prod' && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Production Environment</h3>
            <p className="text-xs text-amber-800 mt-1">
              You are working in a production environment. Changes here affect live users and data.
              Standard rate limits and auto-suspend are enabled.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
