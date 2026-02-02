/**
 * Overview Section
 *
 * The main overview section for the MCP documentation.
 */

'use client'

import { motion } from 'framer-motion'
import { Globe, ChevronRight } from 'lucide-react'
import { navItems } from '../../constants'

interface OverviewSectionProps {
  onSectionChange?: (sectionId: string) => void
}

export function OverviewSection({ onSectionChange }: OverviewSectionProps) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
          <Globe className="w-4 h-4" />
          Model Context Protocol
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">
          Connect AI to your <span className="text-emerald-700">backend instantly</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Integrate NextMavens services with Claude Code, Cursor, and other AI tools using MCP.
          Access 11 powerful tools for database, auth, storage, and GraphQL operations.
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white mb-8">
        <h2 className="text-2xl font-bold mb-4">What is MCP?</h2>
        <p className="text-slate-300 leading-relaxed mb-6">
          The Model Context Protocol (MCP) is an open standard that allows AI assistants to
          seamlessly connect to external tools and data sources. Think of it as a universal
          plug-in system for AI applications.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Why Use NextMavens MCP?</h3>
            <ul className="space-y-2 text-sm">
              {[
                'Query databases with natural language',
                'Create and manage users through chat',
                'Upload and manage files via AI',
                'Inspect schema and get context',
                'Full database, auth, and storage tools',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-300">
                  <span className="text-emerald-400">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
            <div className="bg-black/30 rounded-xl p-4 mb-4">
              <code className="text-sm text-emerald-300 font-mono">
                git clone https://github.com/Mkid095/nextmavens-mcp-server.git
              </code>
            </div>
            <p className="text-sm text-slate-300">
              Get your API key from the{' '}
              <a href="/dashboard" className="text-emerald-400 hover:text-emerald-300 underline">
                dashboard
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Available Tools</h2>
        <p className="text-slate-600 mb-6">11 MCP tools organized by service category</p>

        <div className="space-y-4">
          {navItems.filter(item => item.tools).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-medium text-slate-900">{item.label}</h3>
                  <p className="text-sm text-slate-600">{item.tools?.length} tools available</p>
                </div>
              </div>
              <button
                onClick={() => onSectionChange?.(item.id)}
                className="text-sm text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
              >
                View tools <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
