/**
 * Database Documentation - Module - Filter Operators Component
 */

import { Filter } from 'lucide-react'
import { FILTER_OPERATORS } from '../constants'

export function FilterOperators() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-slate-900">Query Filters & Operators</h2>
      </div>
      <p className="text-slate-600 mb-6">
        PostgREST provides powerful filtering capabilities through query string operators.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-700">Operator</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Example</th>
            </tr>
          </thead>
          <tbody>
            {FILTER_OPERATORS.map((op) => (
              <tr key={op.operator} className="border-b border-slate-100">
                <td className="py-3 px-4">
                  <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{op.operator}</code>
                </td>
                <td className="py-3 px-4 text-slate-600">{op.description}</td>
                <td className="py-3 px-4">
                  <code className="text-xs text-slate-700">{op.example}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
