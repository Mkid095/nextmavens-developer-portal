import { X, Info, Copy, Check } from 'lucide-react'
import type { NewKeyResponse } from '../../types'
import type { ServiceEndpoints } from '../../types'

interface UsageExamplesModalProps {
  isOpen: boolean
  newKey: NewKeyResponse
  endpoints: ServiceEndpoints
  projectId: string
  copied: string | null
  onClose: () => void
  onCopy: (text: string, id: string) => void
}

export function UsageExamplesModal({
  isOpen,
  newKey,
  endpoints,
  projectId,
  copied,
  onClose,
  onCopy,
}: UsageExamplesModalProps) {
  if (!isOpen) return null

  const apiKey = newKey.secretKey || newKey.apiKey.public_key

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Usage Examples</h2>
            <p className="text-sm text-slate-600 mt-1">Integrate your new API key into your application</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="space-y-6">
          {/* API Integration */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Using the REST API</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-600 mb-2">Make requests with fetch:</p>
                <div className="relative group">
                  <button
                    onClick={() =>
                      onCopy(
                        `const response = await fetch('https://api.nextmavens.cloud/api/projects/${projectId}/users', {
  headers: {
    'X-API-Key': '${apiKey}'
  }
})
const data = await response.json()`,
                        'sdk-example'
                      )
                    }
                    className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    {copied === 'sdk-example' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">{`const response = await fetch('https://api.nextmavens.cloud/api/projects/${projectId}/users', {
  headers: {
    'X-API-Key': '${apiKey}'
  }
})
const data = await response.json()`}</code>
                  </pre>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-2">Example query:</p>
                <div className="relative group">
                  <button
                    onClick={() =>
                      onCopy(
                        `const { data, error } = await client
  .from('users')
  .select('*')
  .limit(10)`,
                        'sdk-query'
                      )
                    }
                    className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    {copied === 'sdk-query' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">{`const { data, error } = await client
  .from('users')
  .select('*')
  .limit(10)`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* REST API Integration */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Using REST API</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-600 mb-2">Example request:</p>
                <div className="relative group">
                  <button
                    onClick={() =>
                      onCopy(
                        `curl -X GET "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}"`,
                        'rest-example'
                      )
                    }
                    className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    {copied === 'rest-example' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">{`curl -X GET "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}"`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Variable */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Environment Variable</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-2">Add to your .env file:</p>
              <div className="relative group">
                <button
                  onClick={() => onCopy(`NEXTMAVENS_API_KEY=${apiKey}`, 'env-example')}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  {copied === 'env-example' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <code className="text-sm text-slate-300 font-mono">NEXTMAVENS_API_KEY={apiKey}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Key Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Key Type: {newKey.apiKey.key_type}</h4>
                <p className="text-sm text-blue-800">
                  {newKey.apiKey.key_type === 'public' &&
                    'This key can be safely used in client-side code (browsers, mobile apps).'}
                  {newKey.apiKey.key_type === 'secret' &&
                    'This key must ONLY be used in server-side code. Never expose it in client-side applications.'}
                  {newKey.apiKey.key_type === 'service_role' &&
                    'This key bypasses row-level security and should only be used in trusted server-side environments.'}
                  {newKey.apiKey.key_type === 'mcp' &&
                    'This token is for AI/IDE integrations using the Model Context Protocol.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
