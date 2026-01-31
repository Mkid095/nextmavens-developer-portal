'use client'

import { Link } from 'lucide-react'

export function ServiceDependencies() {
  const dependencies = [
    { service: 'API Gateway', dependsOn: ['Auth Service', 'Database', 'Redis', 'All Services'] },
    { service: 'Auth Service', dependsOn: ['Database (control_plane schema)'] },
    { service: 'Developer Portal', dependsOn: ['API Gateway', 'Auth Service'] },
    { service: 'GraphQL Service', dependsOn: ['Database'] },
    { service: 'Realtime Service', dependsOn: ['Database'] },
    { service: 'Telegram Storage', dependsOn: ['Database (file metadata)', 'Telegram Bot API'] },
  ]

  return (
    <section id="dependencies" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
        <Link className="w-6 h-6 text-blue-700" />
        Service Dependencies
      </h2>

      <p className="text-slate-600 mb-6">
        Services have specific dependencies on each other. The database is the core dependency.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-700">Service</th>
              <th className="text-left py-3 px-4 font-medium text-slate-700">Depends On</th>
            </tr>
          </thead>
          <tbody>
            {dependencies.map((dep, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-3 px-4 font-medium text-slate-900">{dep.service}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {dep.dependsOn.map((d) => (
                      <span key={d} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-amber-900">
          <strong>Note:</strong> Services communicate via internal Docker network. The API Gateway handles external routing and load balancing.
        </p>
      </div>
    </section>
  )
}
