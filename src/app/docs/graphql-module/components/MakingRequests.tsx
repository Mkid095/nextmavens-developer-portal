/**
 * GraphQL Documentation - Module - Making Requests Component
 */

import { Code } from 'lucide-react'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import { ADDITIONAL_EXAMPLES } from '../constants/examples'

export function MakingRequests() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <Code className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-semibold text-slate-900">Making GraphQL Requests</h2>
      </div>

      <div className="space-y-6">
        {ADDITIONAL_EXAMPLES.map((example) => (
          <div key={example.title}>
            <h3 className="font-semibold text-slate-900 mb-3">{example.title}</h3>
            {example.description && <p className="text-slate-600 mb-3">{example.description}</p>}
            <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
          </div>
        ))}
      </div>
    </div>
  )
}
