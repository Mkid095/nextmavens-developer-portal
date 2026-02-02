/**
 * GraphQL Documentation - Module - Query Examples Component
 */

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import { QUERY_EXAMPLES } from '../constants'

export function QueryExamples() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Query Examples</h2>
      <div className="space-y-6 mb-12">
        {QUERY_EXAMPLES.map((example, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">{example.title}</h3>
            </div>
            <div className="p-6">
              <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
              {example.variables && (
                <div className="mt-4">
                  <h4 className="font-medium text-slate-900 mb-2">Variables</h4>
                  <CodeBlockWithCopy>{JSON.stringify(example.variables, null, 2)}</CodeBlockWithCopy>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
