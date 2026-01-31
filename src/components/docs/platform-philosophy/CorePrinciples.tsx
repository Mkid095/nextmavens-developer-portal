'use client'

import { motion } from 'framer-motion'
import { Radio, Database, HardDrive, Lock, Server, Zap, Code2, Shield, Settings } from 'lucide-react'

const principles = [
  {
    icon: Radio,
    title: 'Realtime-First',
    description: 'Every table has realtime subscriptions enabled by default. No configuration required.',
    color: 'emerald',
  },
  {
    icon: Database,
    title: 'PostgreSQL-Native',
    description: 'Built on Postgres with direct SQL access. No proprietary query languages or ORM abstractions.',
    color: 'blue',
  },
  {
    icon: HardDrive,
    title: 'Unified Storage',
    description: 'File storage, database, and CDN in one platform. No separate S3 buckets or CDN configuration.',
    color: 'orange',
  },
  {
    icon: Lock,
    title: 'JWT Authentication',
    description: 'Standard JWT tokens with configurable expiry. No custom auth protocols or vendor lock-in.',
    color: 'purple',
  },
  {
    icon: Server,
    title: 'Service Mesh Ready',
    description: 'Built for microservices. Share auth, storage, and database across independent services.',
    color: 'cyan',
  },
  {
    icon: Zap,
    title: 'Edge Functions',
    description: 'Serverless functions deployed globally. Auto-scaling with cold starts under 50ms.',
    color: 'amber',
    comingSoon: true,
  },
  {
    icon: Code2,
    title: 'TypeScript-Native',
    description: 'Full TypeScript support from database to frontend. Auto-generated types for all queries.',
    color: 'teal',
  },
  {
    icon: Shield,
    title: 'Row-Level Security',
    description: 'Database-level security policies. Users can only access data they explicitly have permission for.',
    color: 'red',
  },
]

export function CorePrinciples() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-8 border border-slate-200 mb-12"
    >
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
            cyan: 'bg-cyan-100 text-cyan-700',
            purple: 'bg-purple-100 text-purple-700',
            orange: 'bg-orange-100 text-orange-700',
            red: 'bg-red-100 text-red-700',
            teal: 'bg-teal-100 text-teal-700',
            amber: 'bg-amber-100 text-amber-700',
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
    </motion.div>
  )
}
