/**
 * Storage Documentation - Code Examples Component
 */

import { Code } from 'lucide-react'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import { CODE_EXAMPLES } from '../constants/examples'

export function CodeExamples() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Code className="w-6 h-6 text-orange-600" />
        <h2 className="text-xl font-semibold text-slate-900">Code Examples</h2>
      </div>

      <div className="space-y-6">
        {CODE_EXAMPLES.map((example) => (
          <div key={example.title}>
            <h3 className="font-semibold text-slate-900 mb-3">{example.title}</h3>
            <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
          </div>
        ))}
      </div>
    </div>
  )
}
