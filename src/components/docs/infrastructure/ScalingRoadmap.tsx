'use client'

import { TrendingUp } from 'lucide-react'

const scalingPhases = [
  {
    phase: 'Phase 1: Current',
    status: 'active',
    items: [
      'Single VPS deployment',
      'Vertical scaling only',
      'Manual deployment',
      'Basic monitoring',
    ],
  },
  {
    phase: 'Phase 2: Near Term',
    status: 'planned',
    items: [
      'Horizontal scaling for stateless services',
      'Separate database server',
      'Redis caching layer',
      'Automated backups',
    ],
  },
  {
    phase: 'Phase 3: Medium Term',
    status: 'planned',
    items: [
      'Multi-region deployment',
      'CDN integration',
      'Load balancer',
      'Auto-scaling groups',
    ],
  },
  {
    phase: 'Phase 4: Long Term',
    status: 'planned',
    items: [
      'Kubernetes orchestration',
      'Service mesh',
      'Global edge deployment',
      'Advanced observability',
    ],
  },
]

export function ScalingRoadmap() {
  return (
    <section id="scaling" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-blue-700" />
        Scaling Roadmap
      </h2>

      <p className="text-slate-600 mb-6">
        NextMavens has a planned scaling roadmap to evolve from single-instance to multi-region deployment.
      </p>

      <div className="space-y-4">
        {scalingPhases.map((phase, idx) => (
          <div key={idx} className="border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{phase.phase}</h3>
              <span className={`text-xs px-3 py-1 rounded-full ${
                phase.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {phase.status === 'active' ? 'Active' : 'Planned'}
              </span>
            </div>
            <ul className="space-y-2">
              {phase.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-slate-400 mt-1">•</span>
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
