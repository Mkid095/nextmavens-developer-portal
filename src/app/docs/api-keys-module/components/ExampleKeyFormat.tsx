/**
 * API Keys Documentation - Example Key Format Component
 */

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import { EXAMPLE_KEY_FORMAT } from '../constants'

export function ExampleKeyFormat() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Example Key Format</h2>
      <CodeBlockWithCopy>{EXAMPLE_KEY_FORMAT}</CodeBlockWithCopy>
    </div>
  )
}
