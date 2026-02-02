/**
 * Authentication Documentation - Module - JWT Structure Component
 */

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import { JWT_STRUCTURE } from '../constants'
import { AUTH_USAGE_EXAMPLE } from '../constants/examples'

export function JwtStructure() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">JWT Token Structure</h2>
      <p className="text-slate-600 mb-6">
        Access tokens are JWTs signed with HMAC-SHA256. Include them in the Authorization header.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Header</h3>
          <div className="bg-slate-900 rounded-lg p-4">
            <code className="text-xs text-emerald-400 block">
              {JSON.stringify(JWT_STRUCTURE.header, null, 2)}
            </code>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Payload</h3>
          <div className="bg-slate-900 rounded-lg p-4">
            <code className="text-xs text-emerald-400 block">
              {JSON.stringify(JWT_STRUCTURE.payload, null, 2)}
            </code>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-slate-900 mb-3">Usage Example</h3>
        <CodeBlockWithCopy>{AUTH_USAGE_EXAMPLE}</CodeBlockWithCopy>
      </div>
    </div>
  )
}
