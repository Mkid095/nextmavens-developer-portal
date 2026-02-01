import { Lock } from 'lucide-react'

interface SecretsTabProps {
  projectId: string
}

export function SecretsTab({ projectId }: SecretsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Secrets Management</h2>
          <p className="text-sm text-slate-600 mt-1">Securely store and manage your application secrets</p>
        </div>
      </div>

      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Secrets Management</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Store API keys, tokens, and other sensitive data securely. Secrets are encrypted at rest and
          only accessible to authorized users.
        </p>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-amber-800">
            <strong>Coming Soon:</strong> Full secrets management capabilities will be available in an
            upcoming release.
          </p>
        </div>
      </div>
    </div>
  )
}
