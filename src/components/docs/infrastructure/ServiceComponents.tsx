'use client'

import { HardDrive } from 'lucide-react'

const services = [
  {
    name: 'API Gateway',
    port: 8080,
    description: 'Central entry point for all API requests',
    responsibilities: ['Rate limiting', 'JWT validation', 'Request routing', 'CORS handling'],
  },
  {
    name: 'Auth Service',
    port: 4000,
    description: 'User authentication and JWT token management',
    responsibilities: ['User registration', 'Login/logout', 'Token refresh', 'Password reset'],
  },
  {
    name: 'Database/PostgREST',
    port: 3001,
    description: 'PostgreSQL with REST API access',
    responsibilities: ['CRUD operations', 'RLS policies', 'Prepared statements', 'Multi-tenant'],
  },
  {
    name: 'GraphQL Service',
    port: 4004,
    description: 'Postgraphile-powered GraphQL',
    responsibilities: ['Auto schema', 'Relations', 'Mutations', 'Type safety'],
  },
  {
    name: 'Realtime Service',
    port: 4003,
    description: 'PostgreSQL LISTEN/NOTIFY for realtime',
    responsibilities: ['WebSocket', 'CDC events', 'Channel subscriptions', 'Event streaming'],
  },
  {
    name: 'Telegram Storage',
    port: 4005,
    description: 'File storage via Telegram',
    responsibilities: ['File upload', 'CDN URLs', 'Metadata storage', 'Telegram integration'],
  },
  {
    name: 'Developer Portal',
    port: 3000,
    description: 'Main web application',
    responsibilities: ['Project dashboard', 'API key management', 'Documentation', 'User settings'],
  },
  {
    name: 'Dokploy',
    port: 3000,
    description: 'Deployment management',
    responsibilities: ['Container orchestration', 'Service deployment', 'SSL management', 'Log viewing'],
  },
]

export function ServiceComponents() {
  return (
    <section id="services" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
        <HardDrive className="w-6 h-6 text-blue-700" />
        Service Components
      </h2>

      <p className="text-slate-600 mb-6">
        NextMavens consists of several microservices, each running as a Docker container:
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div key={service.name} className="bg-slate-50 rounded-lg p-5 border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{service.name}</h3>
                <p className="text-sm text-slate-600">{service.description}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                :{service.port}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {service.responsibilities.map((resp) => (
                <span key={resp} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                  {resp}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
