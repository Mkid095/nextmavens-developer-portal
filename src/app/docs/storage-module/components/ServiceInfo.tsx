/**
 * Storage Documentation - Service Info Component
 */

import { Server, Upload, CheckCircle } from 'lucide-react'
import { STORAGE_CONFIG } from '../constants'

export function ServiceInfo() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Information</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Base URL</span>
          </div>
          <code className="text-xs text-blue-700 break-all">{STORAGE_CONFIG.domain}</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Max File Size</span>
          </div>
          <p className="text-sm text-slate-700">{STORAGE_CONFIG.maxFileSize}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Features</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {STORAGE_CONFIG.features.map((feat) => (
              <span key={feat} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
