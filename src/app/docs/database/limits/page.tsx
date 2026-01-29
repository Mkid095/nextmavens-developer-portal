'use client'

import Link from 'next/link'
import { Database, Clock, Gauge, HardDrive, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const limits = [
  {
    name: 'Max Rows Per Query',
    value: '1,000',
    unit: 'rows',
    icon: Database,
    color: 'blue',
    description: 'Maximum number of rows that can be returned in a single query result',
    applies: 'All SELECT queries',
    recommendation: 'Use pagination or LIMIT/OFFSET for larger datasets',
  },
  {
    name: 'Query Timeout',
    value: '30',
    unit: 'seconds',
    icon: Clock,
    color: 'orange',
    description: 'Maximum execution time for a single database query',
    applies: 'All query operations',
    recommendation: 'Optimize slow queries with proper indexing and query structure',
  },
  {
    name: 'Rate Limit',
    value: '100',
    unit: 'requests/minute',
    icon: Gauge,
    color: 'emerald',
    description: 'Maximum number of database requests allowed per minute per project',
    applies: 'All database operations',
    recommendation: 'Implement client-side caching and batch operations when possible',
  },
  {
    name: 'Connection Pool',
    value: '20',
    unit: 'connections/project',
    icon: HardDrive,
    color: 'purple',
    description: 'Maximum concurrent database connections per project',
    applies: 'All database connections',
    recommendation: 'Use connection pooling and close connections when done',
  },
  {
    name: 'Transaction Timeout',
    value: '60',
    unit: 'seconds',
    icon: AlertTriangle,
    color: 'red',
    description: 'Maximum duration a database transaction can remain open',
    applies: 'Multi-statement transactions',
    recommendation: 'Keep transactions short and focused to avoid locks',
  },
]

export default function DatabaseLimitsPage() {
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
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Link href="/docs/database" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Database Service
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Database className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Database Limits</h1>
            <p className="text-slate-600">Query limits, timeouts, and rate limits</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Database limits are in place to ensure fair resource allocation and maintain system stability.
            Understanding these limits helps you design your application to work within constraints and avoid errors.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-900 mb-2">Error Response</h3>
            <p className="text-sm text-amber-800">
              When a limit is exceeded, you'll receive an error with details about which limit was hit and how to resolve it.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {limits.map((limit, index) => {
            const Icon = limit.icon
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-700',
              orange: 'bg-orange-100 text-orange-700',
              emerald: 'bg-emerald-100 text-emerald-700',
              purple: 'bg-purple-100 text-purple-700',
              red: 'bg-red-100 text-red-700',
            }[limit.color]

            return (
              <motion.div
                key={limit.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClasses}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{limit.name}</h3>
                        <p className="text-slate-600 text-sm">{limit.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-slate-900">{limit.value}</p>
                      <p className="text-sm text-slate-600">{limit.unit}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Applies To</h4>
                      <p className="text-sm text-slate-600">{limit.applies}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Recommendation</h4>
                      <p className="text-sm text-slate-600">{limit.recommendation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mt-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Best Practices</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600">Use <code className="bg-slate-100 px-2 py-1 rounded text-sm">LIMIT</code> and <code className="bg-slate-100 px-2 py-1 rounded text-sm">OFFSET</code> for pagination to stay within the 1,000 row limit</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600">Create proper indexes on frequently queried columns to avoid timeouts</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600">Implement client-side caching to reduce API calls and stay within rate limits</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600">Keep transactions short and focused to avoid exceeding timeout limits</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600">Monitor your usage and implement exponential backoff for rate limit errors</p>
            </li>
          </ul>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/database" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Database Service
          </Link>
          <Link href="/docs/auth" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Authentication Service
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
