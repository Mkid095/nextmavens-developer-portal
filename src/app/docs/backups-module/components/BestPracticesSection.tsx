/**
 * Backups Documentation - Best Practices Section Component
 */

import { CheckCircle2 } from 'lucide-react'
import { BEST_PRACTICES } from '../constants'

export function BestPracticesSection() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Best Practices</h2>
      <div className="space-y-4">
        {BEST_PRACTICES.map((practice) => (
          <div key={practice.category} className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{practice.category}</h3>
            <ul className="space-y-2">
              {practice.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
