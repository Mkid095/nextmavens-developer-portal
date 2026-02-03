import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ServiceKey } from './constants'

interface ServiceEndpoints {
  auth: string
  storage: string
  graphql: string
  realtime: string
}

interface SecurityInfo {
  title: string
  text: string
  color?: string
  details?: { label: string; value: string }[]
}

export function createQuickActionLink(
  projectSlug: string,
  subPath: string | null,
  text: string,
  Icon: React.ComponentType<{ className?: string }>
) {
  if (!subPath) return null

  return (
    <Link
      href={`/studio/${projectSlug}${subPath}`}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium"
    >
      <Icon className="w-4 h-4" />
      <span>{text}</span>
      <ChevronRight className="w-4 h-4" />
    </Link>
  )
}

export function createSecurityInfo(info: SecurityInfo | null) {
  if (!info) return null

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800'
  }

  const colorClass = colorClasses[info.color || 'blue'] || colorClasses.blue

  return (
    <div className={colorClass}>
      <p className="text-sm text-slate-800">
        <strong>{info.title}:</strong> {info.text}
      </p>
      {info.details && (
        <div className="grid grid-cols-2 gap-4 mt-3">
          {info.details.map((detail, idx) => (
            <div key={idx}>
              <p className="text-sm text-slate-600 mb-1">{detail.label}</p>
              <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{detail.value}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function createConnectionDetails(endpoints: ServiceEndpoints, serviceName: ServiceKey) {
  const endpoint = endpoints[serviceName]
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-600 mb-1">{serviceName} Endpoint</p>
        <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoint}</code>
      </div>
    </div>
  )
}
