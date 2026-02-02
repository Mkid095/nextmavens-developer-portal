/**
 * API Keys Documentation - Key Type Card Component
 */

import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { KEY_COLOR_CLASSES, KEY_WARNING_CLASSES } from '../constants'
import type { KeyType } from '../types'

interface KeyTypeCardProps {
  keyType: KeyType
  index: number
}

export function KeyTypeCard({ keyType, index }: KeyTypeCardProps) {
  const Icon = keyType.icon
  const colorClasses = KEY_COLOR_CLASSES[keyType.color] || 'bg-slate-100 text-slate-700 border-slate-200'
  const warningClasses = KEY_WARNING_CLASSES[keyType.color] || 'bg-slate-50 border-slate-200 text-slate-800'

  const getRiskBadgeClass = (security: string) => {
    if (security.includes('Very high')) return 'bg-red-100 text-red-700'
    if (security.includes('High')) return 'bg-orange-100 text-orange-700'
    if (security.includes('Medium')) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <motion.div
      key={keyType.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <div className={`p-6 border-b ${colorClasses.replace('bg-', 'border-').split(' ')[0]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${colorClasses}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{keyType.name}</h3>
              <p className="text-slate-600 text-sm">{keyType.description}</p>
            </div>
          </div>
          <code className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded font-mono">
            {keyType.prefix}
          </code>
        </div>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Use Cases</h4>
            <ul className="space-y-2">
              {keyType.useCases.map((useCase) => (
                <li key={useCase} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  {useCase}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Included Scopes</h4>
            <div className="flex flex-wrap gap-2">
              {keyType.scopes.map((scope) => (
                <span
                  key={scope}
                  className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded font-mono"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={`mt-4 p-4 rounded-lg border ${warningClasses}`}>
          <div className="flex items-start gap-2">
            <Eye className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium mb-1">Security Notice</h5>
              <p className="text-sm">{keyType.warning}</p>
            </div>
          </div>
        </div>

        {keyType.accessLevels && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-900 mb-2">Access Levels</h4>
            <div className="flex flex-wrap gap-2">
              {keyType.accessLevels.map((level) => (
                <span
                  key={level}
                  className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded font-mono"
                >
                  {level}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2">Risk Level</h4>
          <span className={`text-xs px-2 py-1 rounded ${getRiskBadgeClass(keyType.security)}`}>
            {keyType.security}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
