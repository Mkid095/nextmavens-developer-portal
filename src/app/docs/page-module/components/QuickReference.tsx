/**
 * Docs Main Page - Module - Quick Reference Component
 */

import { QUICK_REFERENCE } from '../constants'

export function QuickReference() {
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Quick Reference</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Service</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Public URL</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {QUICK_REFERENCE.map((ref) => (
                <tr key={ref.name} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{ref.name}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-blue-700 hover:text-blue-800">
                      {ref.url}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{ref.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
