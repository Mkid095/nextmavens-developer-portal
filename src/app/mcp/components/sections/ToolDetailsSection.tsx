/**
 * Tool Details Section
 *
 * Displays details for tools in Database, Auth, Storage, and GraphQL categories.
 */

'use client'

import { motion } from 'framer-motion'
import { navItems, toolDetails } from '../../constants'
import { CodeBlock } from '../ui'
import type { NavItem } from '../../types'

interface ToolDetailsSectionProps {
  activeSection: string
}

const sectionColors: Record<string, { bg: string; text: string }> = {
  database: { bg: 'bg-blue-100', text: 'text-blue-700' },
  auth: { bg: 'bg-purple-100', text: 'text-purple-700' },
  storage: { bg: 'bg-orange-100', text: 'text-orange-700' },
  graphql: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
}

export function ToolDetailsSection({ activeSection }: ToolDetailsSectionProps) {
  const item = navItems.find((i) => i.id === activeSection) as NavItem
  const Icon = item.icon
  const colors = sectionColors[activeSection] || { bg: 'bg-slate-100', text: 'text-slate-700' }

  return (
    <motion.div
      key={activeSection}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{item.label}</h1>
          <p className="text-slate-600">{item.tools?.length} tools available</p>
        </div>
      </div>

      <div className="space-y-6">
        {item.tools?.map((tool) => {
          const details = toolDetails[tool.name]
          return (
            <ToolCard
              key={tool.name}
              tool={tool}
              details={details}
              icon={Icon}
            />
          )
        })}
      </div>
    </motion.div>
  )
}

interface ToolCardProps {
  tool: { name: string; desc: string }
  details?: { description: string; params: Array<{ name: string; type: string; required: boolean; description: string }> }
  icon: any
}

function ToolCard({ tool, details, icon: Icon }: ToolCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            <code className="bg-slate-100 px-2 py-1 rounded text-sm">{tool.name}</code>
          </h3>
          <p className="text-slate-600">{details?.description || tool.desc}</p>
        </div>
        <Icon className="w-5 h-5 text-slate-400" />
      </div>

      {details?.params && details.params.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Parameters</h4>
          <div className="space-y-2">
            {details.params.map((param) => (
              <div key={param.name} className="flex items-start gap-3 text-sm">
                <code className={`px-2 py-0.5 rounded text-xs ${
                  param.required ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {param.type}
                </code>
                <div className="flex-1">
                  <span className={`font-medium ${param.required ? 'text-slate-900' : 'text-slate-600'}`}>
                    {param.name}
                  </span>
                  {!param.required && <span className="text-slate-400 ml-1">(optional)</span>}
                  <p className="text-slate-500 text-xs mt-0.5">{param.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 pt-4 mt-4">
        <h4 className="text-sm font-medium text-slate-900 mb-2">Example Usage</h4>
        <CodeBlock code={`# Ask Claude Code to:
"Use ${tool.name} to ${tool.desc.toLowerCase()}"`} />
      </div>
    </div>
  )
}
