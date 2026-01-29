'use client'

import Link from 'next/link'
import { ArrowLeft, Lightbulb, Database, CheckCircle, AlertCircle, Code, Zap, Shield, GitBranch, Radio, Stream } from 'lucide-react'
import { motion } from 'framer-motion'

const principles = [
  {
    icon: Database,
    title: 'Postgres-Native',
    description: 'SQL-first architecture with direct database access',
    color: 'blue',
    comingSoon: false,
  },
  {
    icon: Zap,
    title: 'Realtime DB-Driven',
    description: 'Change Data Capture (CDC) powered subscriptions',
    color: 'emerald',
    comingSoon: false,
  },
  {
    icon: Shield,
    title: 'JWT-First Auth',
    description: 'Stateless token-based authentication',
    color: 'purple',
    comingSoon: true,
  },
  {
    icon: GitBranch,
    title: 'Multi-Tenant by Default',
    description: 'Schema-based tenant isolation',
    color: 'orange',
    comingSoon: true,
  },
  {
    icon: AlertCircle,
    title: 'Security Principles',
    description: 'Fail closed, audit everything, zero trust',
    color: 'red',
    comingSoon: true,
  },
  {
    icon: Code,
    title: 'API-First Design',
    description: 'CLI and automation are first-class citizens',
    color: 'teal',
    comingSoon: true,
  },
]

const realtimeBenefits = [
  {
    title: 'Subscriptions Follow Table Structure',
    description: 'Subscribe to any table directly. No custom protocols, no separate schema definitions. Your database structure drives your realtime subscriptions.',
    icon: Database,
    examples: [
      'Subscribe to: users, orders, messages, any table',
      'Filters use SQL WHERE clauses',
      'Schema-driven, not protocol-driven',
      'Works with existing database constraints',
    ],
  },
  {
    title: 'CDC-Based, Not Custom Protocol',
    description: 'Change Data Capture (CDC) using Postgres logical replication captures database changes at the source. Reliable, ordered, and efficient.',
    icon: Radio,
    examples: [
      'Captures INSERT, UPDATE, DELETE operations',
      'Real-time streaming via logical replication',
      'Efficient: only changed data transmitted',
      'Ordered delivery guarantees',
    ],
  },
  {
    title: 'Schema-Driven and Automatic',
    description: 'When you modify your schema, subscriptions automatically adapt. No manual configuration, no redeployment needed.',
    icon: Zap,
    examples: [
      'Automatic sync with database schema',
      'No separate subscription configuration',
      'Add/remove columns without breaking clients',
      'DDL changes propagate instantly',
    ],
  },
]

const realtimeComparison = [
  {
    approach: 'NextMavens DB-Driven',
    description: 'Postgres CDC → WebSocket',
    pros: [
      'Subscriptions map 1:1 to tables',
      'Use existing SQL knowledge',
      'Schema changes are automatic',
      'Ordered delivery guaranteed',
      'No duplicate state management',
    ],
  },
  {
    approach: 'Custom Pub/Sub',
    description: 'Application-level events → WebSocket',
    pros: [
      'Flexible event naming',
      'Business logic in events',
      'Language-agnostic',
      'Can work with any database',
    ],
  },
]

const postgresBenefits = [
  {
    title: 'SQL-First, Not ORM-First',
    description: 'Write raw SQL queries. No abstraction layers, no hidden magic, no learning custom query builders. Use the full power of PostgreSQL directly.',
    icon: Code,
    examples: [
      'Window functions and CTEs',
      'Full-text search with tsvector',
      'JSON/JSONB operators',
      'Custom aggregates and types',
    ],
  },
  {
    title: 'Direct Database Access',
    description: 'Connect directly to your Postgres database. Use psql, pgAdmin, DataGrip, or any Postgres client. Your data, your tools, full control.',
    icon: Database,
    examples: [
      'Standard PostgreSQL connection',
      'Use existing tooling ecosystem',
      'No proprietary protocols',
      'Full SQL feature support',
    ],
  },
  {
    title: 'Portability',
    description: 'Your skills and knowledge transfer. Standard SQL means your queries work across systems. No vendor lock-in, no learning curve.',
    icon: GitBranch,
    examples: [
      'Standard PostgreSQL syntax',
      'Migrate to self-hosted Postgres easily',
      'Re-use existing SQL knowledge',
      'Industry-standard protocols',
    ],
  },
  {
    title: 'Power & Familiarity',
    description: 'PostgreSQL is the world\'s most advanced open source database. Leverage 30+ years of development, documentation, and community knowledge.',
    icon: Zap,
    examples: [
      'Advanced indexing strategies',
      'Mature query optimizer',
      'Extensive ecosystem of extensions',
      'Proven at massive scale',
    ],
  },
]

const codeExamples = [
  {
    title: 'Full-Text Search',
    description: 'Use PostgreSQL\'s built-in full-text search capabilities',
    code: `-- Search with ranking
SELECT
  title,
  ts_rank(textsearchable_index_col, query) AS rank
FROM documents,
  to_tsquery('english', 'postgres & native') query
WHERE textsearchable_index_col @@ query
ORDER BY rank DESC;`,
  },
  {
    title: 'JSON Operations',
    description: 'Query and manipulate JSON data natively',
    code: `-- Extract nested JSON data
SELECT
  id,
  metadata->>'user_id' AS user_id,
  metadata->'settings'->>'theme' AS theme
FROM events
WHERE metadata->>'type' = 'click'
  AND CAST(metadata->'timestamp' AS BIGINT) > EXTRACT(EPOCH FROM NOW()) * 1000;`,
  },
  {
    title: 'Window Functions',
    description: 'Perform complex analytics with window functions',
    code: `-- Calculate running totals
SELECT
  date,
  revenue,
  SUM(revenue) OVER (
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM daily_sales;`,
  },
  {
    title: 'Common Table Expressions',
    description: 'Build readable, maintainable complex queries',
    code: `-- Find users with above-average orders
WITH user_order_counts AS (
  SELECT
    user_id,
    COUNT(*) AS order_count
  FROM orders
  GROUP BY user_id
),
avg_orders AS (
  SELECT AVG(order_count) AS avg_count
  FROM user_order_counts
)
SELECT uoc.user_id
FROM user_order_counts uoc, avg_orders ao
WHERE uoc.order_count > ao.avg_count;`,
  },
]

export default function PlatformPhilosophyPage() {
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
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Lightbulb className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Platform Philosophy</h1>
            <p className="text-slate-600">The opinionated foundations that guide NextMavens</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Core Principles</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            NextMavens is built on opinionated technical choices that prioritize developer experience,
            operational simplicity, and long-term maintainability. These principles aren't just preferences—
            they're architectural decisions that affect every aspect of the platform.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-700',
                emerald: 'bg-emerald-100 text-emerald-700',
                purple: 'bg-purple-100 text-purple-700',
                orange: 'bg-orange-100 text-orange-700',
                red: 'bg-red-100 text-red-700',
                teal: 'bg-teal-100 text-teal-700',
              }[principle.color]

              return (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-xl border ${
                    principle.comingSoon
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{principle.title}</h3>
                        {principle.comingSoon && (
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{principle.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Database className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Postgres-Native Approach</h2>
              <p className="text-slate-600">Why SQL-first is the right foundation</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {postgresBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {benefit.examples.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">PostgreSQL Features in Action</h3>
            <p className="text-slate-600 mb-8">
              These examples demonstrate the power of using PostgreSQL directly. No ORM limitations,
              no query builder quirks—just pure, standard SQL.
            </p>

            <div className="space-y-8">
              {codeExamples.map((example, index) => (
                <motion.div
                  key={example.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="font-semibold text-slate-900 mb-2">{example.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{example.description}</p>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-300">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-8 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">The Bottom Line</h4>
                <p className="text-slate-700 leading-relaxed">
                  By embracing PostgreSQL as the primary interface, we avoid the complexity tax of ORM abstractions
                  while gaining access to decades of database innovation. Your queries are portable, your skills are
                  transferable, and your application can leverage the full power of one of the world's most advanced
                  database systems. This is Postgres-native development.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Stream className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Realtime DB-Driven Philosophy</h2>
              <p className="text-slate-600">Why database-driven subscriptions are the right approach</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {realtimeBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-8 border border-slate-200"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Icon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {benefit.examples.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Comparison: DB-Driven vs Custom Protocol</h3>
            <p className="text-slate-600 mb-8">
              Understanding the trade-offs between database-driven realtime and custom pub/sub systems helps
              you make the right architectural decision for your application.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {realtimeComparison.map((approach, index) => (
                <motion.div
                  key={approach.approach}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-xl p-6 border ${
                    approach.approach === 'NextMavens DB-Driven'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {approach.approach === 'NextMavens DB-Driven' ? (
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Stream className="w-5 h-5 text-emerald-700" />
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <Code className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    <h4 className="font-semibold text-slate-900">{approach.approach}</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{approach.description}</p>
                  <ul className="space-y-2">
                    {approach.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          approach.approach === 'NextMavens DB-Driven' ? 'text-emerald-600' : 'text-slate-500'
                        }`} />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Why DB-Driven Realtime Wins</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Single Source of Truth</h4>
                  <p className="text-slate-600">
                    Your database schema is the only schema. No separate subscription definitions to maintain,
                    no sync issues between API and realtime layer.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Automatic Schema Evolution</h4>
                  <p className="text-slate-600">
                    Add a column? Subscriptions see it instantly. Rename a table? No configuration change needed.
                    The database drives the realtime layer automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Built-in Reliability</h4>
                  <p className="text-slate-600">
                    Postgres logical replication provides ordered, at-least-once delivery guarantees.
                    No need to build your own message ordering or deduplication.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-8 border border-emerald-200 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">The Bottom Line</h4>
                <p className="text-slate-700 leading-relaxed mb-4">
                  By making subscriptions database-driven, we eliminate the complexity of custom pub/sub systems
                  while gaining automatic schema sync and built-in reliability. Your data model is your realtime
                  model—no translation layer needed.
                </p>
                <Link
                  href="/docs/realtime"
                  className="inline-flex items-center gap-2 text-emerald-700 font-medium hover:text-emerald-800"
                >
                  Explore Realtime Documentation
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </Link>
        </div>
      </main>
    </div>
  )
}
