/**
 * Backups Documentation - Security Features Section Component
 */

import { SECURITY_FEATURES } from '../constants'
import type { SecurityFeature } from '../types'

export function SecurityFeaturesSection() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Security Features</h2>
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="grid md:grid-cols-2 gap-6">
          {SECURITY_FEATURES.map((feature, index) => (
            <SecurityFeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SecurityFeatureCard({ feature }: { feature: SecurityFeature }) {
  const Icon = feature.icon
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
        <Icon className="w-5 h-5 text-emerald-700" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-1">{feature.title}</h4>
        <p className="text-sm text-slate-600">{feature.description}</p>
      </div>
    </div>
  )
}
