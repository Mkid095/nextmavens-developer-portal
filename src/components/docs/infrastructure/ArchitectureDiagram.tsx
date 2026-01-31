'use client'

import { Globe } from 'lucide-react'

export function ArchitectureDiagram() {
  return (
    <section id="architecture" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
        <Globe className="w-6 h-6 text-blue-700" />
        Architecture Diagram
      </h2>

      <div className="bg-slate-900 rounded-lg p-8 text-slate-100 font-mono text-sm overflow-x-auto mb-6">
        <pre className="whitespace-pre">{`┌─────────────────────────────────────────────────────────────────┐
│                        Single VPS Instance                       │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js Application                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Control   │  │    Data     │  │     Admin       │   │  │
│  │  │    Plane    │  │   Plane     │  │   Break Glass   │   │  │
│  │  │    API      │  │   API       │  │     Powers      │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────┐      │  │
│  │  │           Web Application (Dashboard)            │      │  │
│  │  └──────────────────────────────────────────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL Database                     │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │  control_plane  │  │   data_plane    │                │  │
│  │  │     schema      │  │     schema      │                │  │
│  │  └─────────────────┘  └─────────────────┘                │  │
│  │                                                               │  │
│  │  Per-project databases created on-demand                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Telegram Storage                         │  │
│  │  ┌─────────────┐  ┌─────────────┐                        │  │
│  │  │   File       │  │   Backup    │                        │  │
│  │  │  Storage     │  │   Service    │                        │  │
│  │  └─────────────┘  └─────────────┘                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Dokploy (Deployment)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Traefik       │
                    │   (Reverse      │
                    │    Proxy)       │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Internet      │
                    │   (Port 443)    │
                    └─────────────────┘`}</pre>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Control Plane</h4>
          <p className="text-sm text-blue-700">Project management, API keys, user authentication</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <h4 className="font-semibold text-emerald-900 mb-2">Data Plane</h4>
          <p className="text-sm text-emerald-700">Project-specific data, isolated per tenant</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-2">Admin Tools</h4>
          <p className="text-sm text-orange-700">Emergency access, system maintenance</p>
        </div>
      </div>
    </section>
  )
}
