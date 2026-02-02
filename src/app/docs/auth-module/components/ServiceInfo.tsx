/**
 * Authentication Documentation - Module - Service Info Component
 */

import { Server, CheckCircle, Clock, Lock } from 'lucide-react'
import { AUTH_CONFIG } from '../constants'

export function ServiceInfo() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Information</h2>
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Domain</span>
          </div>
          <code className="text-xs text-blue-700 break-all">{AUTH_CONFIG.domain}</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Port</span>
          </div>
          <code className="text-xs text-slate-700">{AUTH_CONFIG.port}</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Access Token</span>
          </div>
          <p className="text-xs text-slate-600">{AUTH_CONFIG.accessTokenExpiry}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Refresh Token</span>
          </div>
          <p className="text-xs text-slate-600">{AUTH_CONFIG.refreshTokenExpiry}</p>
        </div>
      </div>
    </div>
  )
}
