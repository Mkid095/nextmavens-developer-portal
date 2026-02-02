/**
 * Docs Main Page - Module - Service Card Component
 */

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SERVICES, SERVICE_COLOR_CLASSES } from '../constants'
import type { Service } from '../constants'

export function ServicesSection() {
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Platform Services</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  )
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon
  const colorClasses = SERVICE_COLOR_CLASSES[service.color]

  return (
    <Link
      href={service.path}
      className="group bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-emerald-700">
            {service.title}
          </h3>
          <p className="text-sm text-slate-600">{service.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-slate-700">Domain:</span>
          <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{service.domain}</code>
        </div>
        <div className="flex flex-wrap gap-1">
          {service.endpoints.slice(0, 3).map((ep) => (
            <span key={ep} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {ep}
            </span>
          ))}
          {service.endpoints.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              +{service.endpoints.length - 3} more
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {service.features.slice(0, 3).map((feat) => (
            <span key={feat} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
              {feat}
            </span>
          ))}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all ml-auto" />
    </Link>
  )
}
