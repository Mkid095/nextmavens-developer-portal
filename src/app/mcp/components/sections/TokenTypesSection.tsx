/**
 * Token Types Section
 *
 * Documentation about the three types of MCP tokens: read-only, read-write, and admin.
 */

'use client'

import { motion } from 'framer-motion'
import { Key } from 'lucide-react'
import {
  ReadOnlyTokenCard,
  ReadWriteTokenCard,
  AdminTokenCard,
  ComparisonTable,
  TokenSelectionGuide,
} from './token-types'

export function TokenTypesSection() {
  return (
    <motion.div
      key="token-types"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Key className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">MCP Token Types</h1>
            <p className="text-slate-600">Understanding the three levels of MCP access</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Read-Only Token */}
        <ReadOnlyTokenCard />

        {/* Read-Write Token */}
        <ReadWriteTokenCard />

        {/* Admin Token */}
        <AdminTokenCard />

        {/* Comparison Table */}
        <ComparisonTable />

        {/* When to use each type */}
        <TokenSelectionGuide />
      </div>
    </motion.div>
  )
}
