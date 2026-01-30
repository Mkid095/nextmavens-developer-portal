import Link from 'next/link'
import { BookOpen, Server, Database, HardDrive, Shield, Globe, ArrowRight, ChevronRight, AlertTriangle, Copy, CheckCircle, MapPin, RefreshCw, Clock, AlertCircle } from 'lucide-react'

export default function InfrastructureDocsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/docs" className="text-sm text-slate-900 font-medium">Docs</Link>
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
            <Link href="/register" className="text-sm bg-emerald-900 text-white px-4 py-2 rounded-full hover:bg-emerald-800">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-16">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Server className="w-6 h-6 text-blue-700" />
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">Infrastructure Documentation</h1>
          </div>
          <p className="text-xl text-slate-600">
            Current deployment architecture, scaling roadmap, and operational procedures for NextMavens platform.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">On this page</h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <a href="#current-deployment" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Current Deployment
            </a>
            <a href="#architecture" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Architecture Diagram
            </a>
            <a href="#services" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Service Components
            </a>
            <a href="#database" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Database Architecture
            </a>
            <a href="#storage" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Storage and Backups
            </a>
            <a href="#network" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Network Architecture
            </a>
            <a href="#scaling" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Scaling Roadmap
            </a>
            <a href="#regional-isolation" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Regional Data Isolation
            </a>
            <a href="#disaster-recovery" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Disaster Recovery
            </a>
            <a href="#limitations" className="text-slate-600 hover:text-emerald-700 flex items-center gap-2 py-1">
              <ChevronRight className="w-4 h-4" /> Current Limitations
            </a>
          </div>
        </div>

        {/* Current Deployment Section */}
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
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900 w-1/3">Infrastructure</td>
                    <td className="py-3 text-slate-600">Single VPS (Virtual Private Server)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900">Services</td>
                    <td className="py-3 text-slate-600">All services co-located on same instance</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900">Web Server</td>
                    <td className="py-3 text-slate-600">Next.js with built-in server / Node.js</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900">Database</td>
                    <td className="py-3 text-slate-600">PostgreSQL (Cloud-hosted instance)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900">Storage</td>
                    <td className="py-3 text-slate-600">Telegram for file storage and backups</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900">Region</td>
                    <td className="py-3 text-slate-600">Single region (US-East)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900">Scalability</td>
                    <td className="py-3 text-slate-600">Vertical scaling only</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 font-medium text-slate-900">Load Balancing</td>
                    <td className="py-3 text-slate-600">None (single instance)</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-slate-900">CDN</td>
                    <td className="py-3 text-slate-600">Not implemented</td>
                  </tr>
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

        {/* Architecture Diagram */}
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
│  │              Telegram Files (Storage/Backups)              │  │
│  │  • User file uploads                                       │  │
│  │  • Database backups (daily)                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘`}</pre>
          </div>
        </section>

        {/* Service Components */}
        <section id="services" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <Server className="w-6 h-6 text-blue-700" />
            Service Components
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h3 className="font-semibold text-blue-900 mb-3">Control Plane</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• API: <code className="text-xs bg-blue-100 px-1 rounded">/api/*</code> endpoints</li>
                <li>• JWT-based authentication</li>
                <li>• Project management (CRUD)</li>
                <li>• API key generation/rotation</li>
                <li>• Break glass emergency powers</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
              <h3 className="font-semibold text-purple-900 mb-3">Data Plane</h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>• Direct database access API</li>
                <li>• SQL query execution</li>
                <li>• Safety limits enforced</li>
                <li>• Schema management</li>
                <li>• Edge functions deployment</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
              <h3 className="font-semibold text-orange-900 mb-3">Admin Dashboard</h3>
              <ul className="text-sm text-orange-800 space-y-2">
                <li>• Project monitoring</li>
                <li>• Developer management</li>
                <li>• Audit logs review</li>
                <li>• System health status</li>
                <li>• Backup controls</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Database Architecture */}
        <section id="database" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-700" />
            Database Architecture
          </h2>

          <p className="text-slate-600 mb-6">
            PostgreSQL is deployed with the following schema structure:
          </p>

          <div className="bg-slate-50 rounded-lg p-6 font-mono text-sm">
            <pre className="text-slate-800">{`PostgreSQL Instance
│
├── control_plane schema
│   ├── developers      - Developer accounts
│   ├── projects        - Project metadata
│   ├── api_keys        - API key management
│   ├── admin_sessions  - Break glass sessions
│   ├── admin_actions   - Break glass audit logs
│   └── audit_logs      - General audit trail
│
└── data_plane schema (per project)
    ├── [project_name]  - Project-specific database
    └── [tables]        - User-defined tables`}</pre>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Database Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• PostgreSQL 8.11+</li>
                <li>• Connection pool: max 20</li>
                <li>• Row Level Security (RLS)</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Data Plane Features</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Per-project databases</li>
                <li>• On-demand creation</li>
                <li>• Isolated schemas</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Storage and Backups */}
        <section id="storage" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-blue-700" />
            Storage and Backups
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">File Storage</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <ul className="text-sm text-orange-800 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Telegram API for file uploads
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Download URLs for public access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Per-project file isolation
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Database Backups</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="text-sm text-green-800 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Daily automated backups
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Stored in Telegram
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Configurable retention (30 days default)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Manual restore available
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Backup Endpoints</h4>
            <div className="font-mono text-sm space-y-1">
              <div><code className="text-purple-700">POST</code> <code className="text-slate-700">/api/backup/export</code> - Generate SQL dump</div>
              <div><code className="text-purple-700">POST</code> <code className="text-slate-700">/api/backup/export-logs</code> - Export logs</div>
              <div><code className="text-purple-700">POST</code> <code className="text-slate-700">/api/backup/restore</code> - Restore from backup</div>
            </div>
          </div>
        </section>

        {/* Network Architecture */}
        <section id="network" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-700" />
            Network Architecture
          </h2>

          <div className="bg-slate-900 rounded-lg p-8 text-slate-100 font-mono text-sm overflow-x-auto mb-6">
            <pre className="whitespace-pre">{`                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │  VPS Firewall   │
              │  (Port 80/443)  │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Traefik RP    │
              │  (SSL Terminate)│
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Node.js /     │
              │   Next.js App   │
              │   (Port 3000)   │
              └─────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ PostgreSQL │  │  Telegram │  │  Logs /   │
  │  Database  │  │   Files   │  │ Monitoring│
  └───────────┘  └───────────┘  └───────────┘`}</pre>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Security</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• TLS 1.2+ encryption</li>
                <li>• Let's Encrypt certs</li>
                <li>• Firewall: 80/443 only</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Routing</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Traefik reverse proxy</li>
                <li>• Automatic SSL</li>
                <li>• HTTP/2 support</li>
              </ul>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Access</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• SSH: key auth only</li>
                <li>• No public database port</li>
                <li>• Internal services only</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Scaling Roadmap */}
        <section id="scaling" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <Server className="w-6 h-6 text-blue-700" />
            Scaling Roadmap
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">Phase 1: Horizontal Scaling</h3>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Planned: Q2 2026</span>
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Load balancer for multiple application instances</li>
                  <li>• Database connection pooling</li>
                  <li>• Redis for session management and caching</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">Phase 2: Multi-Region Deployment</h3>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Planned: Q3 2026</span>
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Regional deployments: US, EU, Asia</li>
                  <li>• Region selector for project creation</li>
                  <li>• Cross-region data replication (optional)</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">Phase 3: Auto-Scaling</h3>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Planned: Q4 2026</span>
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Auto-scaling based on load metrics</li>
                  <li>• Container orchestration (Kubernetes/Docker)</li>
                  <li>• CDN for static assets</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Regional Data Isolation */}
        <section id="regional-isolation" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-700" />
            Regional Data Isolation
          </h2>

          <p className="text-slate-600 mb-6">
            NextMavens is designed with <strong>data sovereignty</strong> in mind. As we scale to multiple regions, your data remains in the region you select, ensuring compliance with data residency requirements.
          </p>

          {/* Current State */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Current State: Single Region
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              All data is currently hosted in the <strong>US-East</strong> region. As we expand globally, regional isolation will become a core platform feature.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <CheckCircle className="w-4 h-4" />
                <span>Region: <strong>US-East</strong> | All projects currently reside here</span>
              </div>
            </div>
          </div>

          {/* Future Regional Deployment */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              Future: Multi-Region Deployment (Planned Q3 2026)
            </h3>
            <p className="text-sm text-purple-800 mb-4">
              When multi-region deployment launches, projects will be created in specific regions and data will <strong>never leave</strong> that region unless explicitly configured.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-2xl mb-2">🇺🇸</div>
                <h4 className="font-semibold text-purple-900 mb-1">US Region</h4>
                <p className="text-xs text-purple-700">Primary region for North American users</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-2xl mb-2">🇪🇺</div>
                <h4 className="font-semibold text-purple-900 mb-1">EU Region</h4>
                <p className="text-xs text-purple-700">GDPR compliant for European users</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-2xl mb-2">🌏</div>
                <h4 className="font-semibold text-purple-900 mb-1">Asia Region</h4>
                <p className="text-xs text-purple-700">Low-latency access for APAC users</p>
              </div>
            </div>
          </div>

          {/* Data Stays in Selected Region */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Data Stays in Selected Region
              </h3>
              <ul className="text-sm text-green-800 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5"></div>
                  <span>Database instances are region-specific</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5"></div>
                  <span>File storage remains in the selected region</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5"></div>
                  <span>API requests are routed to the regional endpoint</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5"></div>
                  <span>No cross-region data transfer by default</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Compliance Implications
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                  <span><strong>GDPR:</strong> EU region ensures data stays in Europe</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                  <span><strong>Data Residency:</strong> Meet country-specific requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                  <span><strong>Auditing:</strong> Regional audit logs for compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                  <span><strong>Legal:</strong> Simplified cross-border data compliance</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Cross-Region Replication (Future) */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">FUTURE</span>
              Cross-Region Replication (Optional)
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              For users who require high availability across regions, we will offer optional cross-region replication as an opt-in feature.
            </p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>Opt-in only:</strong> Explicitly enabled per project</li>
              <li>• <strong>Async replication:</strong> Near-real-time data sync</li>
              <li>• <strong>Failover:</strong> Automatic regional failover on outage</li>
              <li>• <strong>Compliance aware:</strong> Clear indicators when data crosses borders</li>
            </ul>
          </div>

          {/* Region Selector Preview */}
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-xs bg-slate-300 text-slate-700 px-2 py-1 rounded">COMING SOON</span>
              Region Selector (Planned Feature)
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              When creating a new project, you will be able to select the region where your data will be stored. This selection cannot be changed after project creation.
            </p>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-700 mb-3">Preview: Region Selection</div>
              <div className="grid md:grid-cols-3 gap-2">
                <div className="border-2 border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-emerald-500 transition">
                  <div className="text-xl mb-1">🇺🇸</div>
                  <div className="text-xs font-medium text-slate-700">US-East</div>
                  <div className="text-xs text-slate-500">Virginia</div>
                </div>
                <div className="border-2 border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-emerald-500 transition opacity-50">
                  <div className="text-xl mb-1">🇪🇺</div>
                  <div className="text-xs font-medium text-slate-700">EU-West</div>
                  <div className="text-xs text-slate-500">Coming Soon</div>
                </div>
                <div className="border-2 border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-emerald-500 transition opacity-50">
                  <div className="text-xl mb-1">🌏</div>
                  <div className="text-xs font-medium text-slate-700">Asia-East</div>
                  <div className="text-xs text-slate-500">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disaster Recovery */}
        <section id="disaster-recovery" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700" />
            Disaster Recovery
          </h2>

          <p className="text-slate-600 mb-6">
            Our disaster recovery strategy ensures business continuity and data protection through comprehensive backup and recovery procedures.
          </p>

          {/* Current State */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Current State: Daily Backups to Telegram
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Database backups are automatically generated daily and stored securely via Telegram's cloud infrastructure.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Backup Schedule</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Frequency: Daily (automated)</li>
                  <li>• Time: 2:00 AM UTC</li>
                  <li>• Retention: 30 days default</li>
                  <li>• Format: SQL dump files</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Storage Location</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Platform: Telegram Cloud</li>
                  <li>• Encryption: End-to-end</li>
                  <li>• Access: Admin only</li>
                  <li>• Cost: Free (bundled)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RTO/RPO Targets */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              RTO/RPO Targets
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Current Targets</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">RTO (Recovery Time Objective)</span>
                    <span className="text-sm font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded">4-24 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">RPO (Recovery Point Objective)</span>
                    <span className="text-sm font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded">24 hours</span>
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-3">
                  Manual restore process required via admin API
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Future Targets (Multi-Region)</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">RTO (Recovery Time Objective)</span>
                    <span className="text-sm font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded">&lt;1 hour</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">RPO (Recovery Point Objective)</span>
                    <span className="text-sm font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded">&lt;5 minutes</span>
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-3">
                  Automated failover with cross-region replication
                </p>
              </div>
            </div>
          </div>

          {/* Recovery Procedures */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Recovery Procedures
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Step 1: Identify Backup</h4>
                <p className="text-sm text-orange-800 mb-2">
                  Access the admin dashboard to view available backups sorted by date.
                </p>
                <code className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-900">GET /api/backup/list</code>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Step 2: Download Backup File</h4>
                <p className="text-sm text-orange-800 mb-2">
                  Retrieve the selected backup from Telegram storage using the file ID.
                </p>
                <code className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-900">POST /api/backup/download</code>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Step 3: Restore Database</h4>
                <p className="text-sm text-orange-800 mb-2">
                  Execute the restore API to apply the SQL dump to the database.
                </p>
                <code className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-900">POST /api/backup/restore</code>
              </div>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Step 4: Verify Recovery</h4>
                <p className="text-sm text-orange-800 mb-2">
                  Confirm data integrity by checking critical tables and running health checks.
                </p>
                <code className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-900">GET /api/health</code>
              </div>
            </div>
          </div>

          {/* Future: Multi-Region Replication */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">FUTURE</span>
              Multi-Region Replication (Planned: Q3 2026)
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              As we expand to multiple regions, disaster recovery capabilities will be significantly enhanced with automated failover and near-real-time data replication.
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-1 text-sm">Active-Active Replication</h4>
                <p className="text-xs text-amber-700">Data replicated across all active regions</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-1 text-sm">Automated Failover</h4>
                <p className="text-xs text-amber-700">Instant regional failover on outage detection</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-1 text-sm">Point-in-Time Recovery</h4>
                <p className="text-xs text-amber-700">Restore to any specific moment in time</p>
              </div>
            </div>
          </div>

          {/* DR Testing */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              DR Testing Schedule
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Disaster recovery procedures are tested quarterly to ensure restore processes work correctly.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-200">
                <span className="text-blue-900">Frequency: <strong>Quarterly</strong></span>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-200">
                <span className="text-blue-900">Last Test: <strong>2024-01-15</strong></span>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-200">
                <span className="text-blue-900">Status: <strong className="text-green-700">Passed</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* Current Limitations */}
        <section id="limitations" className="bg-amber-50 border border-amber-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-700" />
            Current Limitations
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
              <div>
                <strong className="text-amber-900">Single Point of Failure</strong>
                <p className="text-sm text-amber-800">No redundancy if VPS fails</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
              <div>
                <strong className="text-amber-900">Region Availability</strong>
                <p className="text-sm text-amber-800">Only available in US-East region</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
              <div>
                <strong className="text-amber-900">Scalability</strong>
                <p className="text-sm text-amber-800">Limited to single instance capacity</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
              <div>
                <strong className="text-amber-900">Disaster Recovery</strong>
                <p className="text-sm text-amber-800">Manual backup restoration required</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
              <div>
                <strong className="text-amber-900">Monitoring</strong>
                <p className="text-sm text-amber-800">Basic logging, no comprehensive observability</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
              <div>
                <strong className="text-amber-900">Auto-scaling</strong>
                <p className="text-sm text-amber-800">Not implemented yet</p>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/docs/backups" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Backup Strategy</span>
          </Link>
          <Link href="/docs" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <span>Back to Docs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
