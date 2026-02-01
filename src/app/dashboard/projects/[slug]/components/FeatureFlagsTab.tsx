import { ToggleLeft, ToggleRight, Loader2, AlertCircle } from 'lucide-react'
import type { FeatureFlag } from '../../hooks'

interface FeatureFlagsTabProps {
  projectId: string
  featureFlags: FeatureFlag[]
  flagsLoading: boolean
  flagsError: string | null
  updatingFlag: string | null
  onToggleFlag: (flagName: string, currentEnabled: boolean) => Promise<void>
  onRemoveFlag: (flagName: string) => Promise<void>
}

export function FeatureFlagsTab({
  projectId,
  featureFlags,
  flagsLoading,
  flagsError,
  updatingFlag,
  onToggleFlag,
  onRemoveFlag,
}: FeatureFlagsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Feature Flags</h2>
          <p className="text-sm text-slate-600 mt-1">Manage feature flags for your project</p>
        </div>
      </div>

      {flagsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{flagsError}</span>
        </div>
      )}

      {flagsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : featureFlags.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No feature flags configured</h3>
          <p className="text-slate-600">Feature flags allow you to enable/disable features for your project.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {featureFlags.map((flag) => (
            <div key={flag.name} className="p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{flag.name}</h3>
                    {flag.is_project_specific && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        Project-specific
                      </span>
                    )}
                  </div>
                  {flag.description && (
                    <p className="text-sm text-slate-600 mt-1">{flag.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleFlag(flag.name, flag.enabled)}
                    disabled={updatingFlag === flag.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingFlag === flag.name ? (
                      <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                    ) : flag.enabled ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={`text-sm font-medium ${flag.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                  {flag.is_project_specific && (
                    <button
                      onClick={() => onRemoveFlag(flag.name)}
                      disabled={updatingFlag === flag.name}
                      className="text-sm text-slate-600 hover:text-red-600 transition disabled:opacity-50"
                    >
                      Revert to Global
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
