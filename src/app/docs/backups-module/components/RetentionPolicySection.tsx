/**
 * Backups Documentation - Retention Policy Section Component
 */

import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { RETENTION_INFO } from '../constants'

export function RetentionPolicySection() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Retention Policy</h2>
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-amber-100 rounded-lg">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">30-Day Default Retention</h3>
            <p className="text-slate-600">
              All backups are retained for 30 days by default. Automatic cleanup runs daily to delete
              expired backups from both database records and Telegram storage.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-slate-900">Expiration Warning</span>
            </div>
            <p className="text-sm text-slate-600">
              Notifications sent {RETENTION_INFO.warning} before backup expiration
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-900">Automatic Cleanup</span>
            </div>
            <p className="text-sm text-slate-600">Background job deletes expired backups daily</p>
          </div>
        </div>
      </div>
    </section>
  )
}
