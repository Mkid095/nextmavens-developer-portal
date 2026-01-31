'use client'

import { Server, CheckCircle } from 'lucide-react'

export function CurrentDeployment() {
  const deploymentCharacteristics = [
    { label: 'Infrastructure', value: 'Single VPS (Virtual Private Server)' },
    { label: 'Services', value: 'All services co-located on same instance' },
    { label: 'Web Server', value: 'Next.js with built-in server / Node.js' },
    { label: 'Database', value: 'PostgreSQL (Cloud-hosted instance)' },
    { label: 'Storage', value: 'Telegram for file storage and backups' },
    { label: 'Region', value: 'Single region (US-East)' },
    { label: 'Scalability', value: 'Vertical scaling only' },
    { label: 'Load Balancing', value: 'None (single instance)' },
    { label: 'CDN', value: 'Not implemented' },
  ]

  return (
    <section id="current-deployment" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
        <Server className="w-6 h-6 text-blue-700" />
        Current Deployment
      </h2>

      <p className="text-slate-600 mb-6">
        NextMavens currently runs on a <strong>single VPS deployment</strong> with all services co-located.
      </p>

      <div className="bg-slate-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Deployment Characteristics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {deploymentCharacteristics.map((char, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-3 font-medium text-slate-900 w-1/3">{char.label}</td>
                  <td className="py-3 text-slate-600">{char.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-900">
          <strong>Host:</strong> portal.nextmavens.cloud | <strong>Port:</strong> 3000 | <strong>SSL:</strong> Let's Encrypt via Traefik
        </div>
      </div>
    </section>
  )
}
