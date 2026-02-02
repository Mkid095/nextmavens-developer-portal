/**
 * Comparison Table
 *
 * A table comparing the three token types.
 */

import type { TokenComparison } from '../../../../types'

const comparisonData: TokenComparison[] = [
  { feature: 'Query database', ro: true, rw: true, admin: true },
  { feature: 'Insert records', ro: false, rw: true, admin: true },
  { feature: 'Update records', ro: false, rw: true, admin: true },
  { feature: 'Delete records', ro: false, rw: false, admin: true },
  { feature: 'Read files', ro: true, rw: true, admin: true },
  { feature: 'Upload files', ro: false, rw: true, admin: true },
  { feature: 'User management', ro: false, rw: false, admin: true },
  { feature: 'Publish events', ro: false, rw: false, admin: true },
]

export function ComparisonTable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Token Comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Feature</th>
              <th className="text-center py-3 px-4 font-semibold text-blue-700">Read-Only</th>
              <th className="text-center py-3 px-4 font-semibold text-amber-700">Read-Write</th>
              <th className="text-center py-3 px-4 font-semibold text-red-700">Admin</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {comparisonData.map((row) => (
              <tr key={row.feature} className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-700">{row.feature}</td>
                <td className="py-3 px-4 text-center">
                  {row.ro ? <span className="text-blue-600">✓</span> : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {row.rw ? <span className="text-amber-600">✓</span> : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-3 px-4 text-center">
                  {row.admin ? <span className="text-red-600">✓</span> : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
