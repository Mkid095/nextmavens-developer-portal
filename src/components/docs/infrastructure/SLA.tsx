'use client'

import { FileKey } from 'lucide-react'

const slaMetrics = [
  { metric: 'API Uptime', target: '99.5%', current: '~99%' },
  { metric: 'Response Time (p95)', target: '< 200ms', current: '~150ms' },
  { metric: 'Database Uptime', target: '99.9%', current: '~99.5%' },
  { metric: 'Data Retention', target: '30 days', current: '30 days' },
]

export function SLA() {
  return (
    <section id="sla" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
        <FileKey className="w-6 h-6 text-blue-700" />
        Service Level Agreement (SLA)
      </h2>

      <p className="text-slate-600 mb-6">
        Current service level objectives and actual performance metrics.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-700">Metric</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Target</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Current</th>
            </tr>
          </thead>
          <tbody>
            {slaMetrics.map((metric, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-3 px-4 font-medium text-slate-900">{metric.metric}</td>
                <td className="py-3 px-4 text-slate-600">{metric.target}</td>
                <td className="py-3 px-4">
                  <span className="text-emerald-600">{metric.current}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-900">
          <strong>Enterprise SLA:</strong> Custom SLA agreements available for enterprise customers with guaranteed uptime credits for breaches.
        </p>
      </div>
    </section>
  )
}
