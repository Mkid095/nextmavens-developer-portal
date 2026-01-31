'use client'

import { motion } from 'framer-motion'

const installMethods = [
  { name: 'npm', command: 'npm install nextmavens-js' },
  { name: 'yarn', command: 'yarn add nextmavens-js' },
  { name: 'pnpm', command: 'pnpm add nextmavens-js' },
]

export function SdkInstall() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-8 border border-slate-200 mb-12"
    >
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Installation</h2>
      <p className="text-slate-600 mb-6">
        Install the NextMavens JavaScript SDK using your preferred package manager:
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {installMethods.map((method) => (
          <div key={method.name} className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-700 mb-2">{method.name}</p>
            <code className="text-sm text-blue-700">{method.command}</code>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
