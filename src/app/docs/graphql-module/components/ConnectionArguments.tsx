/**
 * GraphQL Documentation - Module - Connection Arguments Component
 */

import { CONNECTION_ARGS } from '../constants'

export function ConnectionArguments() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Connection Arguments</h2>
      <p className="text-slate-600 mb-6">
        Postgraphile uses Relay-style connections for pagination. These arguments are available on collection fields
        (e.g., <code className="bg-slate-100 px-1 rounded">apiKeysByUserId</code>).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-700">Argument</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Type</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
            </tr>
          </thead>
          <tbody>
            {CONNECTION_ARGS.map((arg) => (
              <tr key={arg.name} className="border-b border-slate-100">
                <td className="py-3 px-4">
                  <code className="text-slate-900">{arg.name}</code>
                </td>
                <td className="py-3 px-4 text-slate-600">{arg.type}</td>
                <td className="py-3 px-4 text-slate-600">{arg.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
