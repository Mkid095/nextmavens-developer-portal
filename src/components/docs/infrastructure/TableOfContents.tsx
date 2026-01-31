'use client'

import { ChevronRight } from 'lucide-react'

const sections = [
  { id: 'current-deployment', label: 'Current Deployment' },
  { id: 'architecture', label: 'Architecture Diagram' },
  { id: 'services', label: 'Service Components' },
  { id: 'dependencies', label: 'Service Dependencies' },
  { id: 'database', label: 'Database Architecture' },
  { id: 'storage', label: 'Storage and Backups' },
  { id: 'network', label: 'Network Architecture' },
  { id: 'security', label: 'Security Architecture' },
  { id: 'scaling', label: 'Scaling Roadmap' },
  { id: 'regional-isolation', label: 'Regional Data Isolation' },
  { id: 'disaster-recovery', label: 'Disaster Recovery' },
  { id: 'sla', label: 'Service Level Agreement (SLA)' },
  { id: 'limitations', label: 'Current Limitations' },
  { id: 'faq', label: 'FAQ' },
]

export function TableOfContents() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">On this page</h2>
      <div className="grid md:grid-cols-2 gap-2 text-sm">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1"
          >
            <ChevronRight className="w-4 h-4" /> {section.label}
          </a>
        ))}
      </div>
    </div>
  )
}
