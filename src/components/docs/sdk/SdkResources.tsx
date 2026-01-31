'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Book, Globe, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react'

export function SdkResources() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-8 border border-slate-200 mb-12"
    >
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Resources</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/docs/graphql"
          className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
        >
          <Globe className="w-5 h-5 text-slate-700" />
          <div>
            <p className="font-medium text-slate-900">GraphQL Guide</p>
            <p className="text-sm text-slate-600">Learn GraphQL queries</p>
          </div>
        </Link>
        <Link
          href="/docs/realtime"
          className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
        >
          <MessageSquare className="w-5 h-5 text-slate-700" />
          <div>
            <p className="font-medium text-slate-900">Realtime Docs</p>
            <p className="text-sm text-slate-600">WebSocket subscriptions</p>
          </div>
        </Link>
        <Link
          href="/docs/auth"
          className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
        >
          <Book className="w-5 h-5 text-slate-700" />
          <div>
            <p className="font-medium text-slate-900">Auth Guide</p>
            <p className="text-sm text-slate-600">Authentication patterns</p>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}

export function SdkNavigation() {
  return (
    <div className="mt-12 flex items-center justify-between">
      <Link href="/docs/realtime" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Realtime Docs
      </Link>
      <Link href="/docs/platform-philosophy" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
        Platform Philosophy
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
