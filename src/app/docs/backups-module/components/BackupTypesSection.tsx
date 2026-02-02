/**
 * Backups Documentation - Backup Types Section Component
 */

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { BACKUP_TYPES, BACKUP_COLOR_CLASSES } from '../constants'
import type { BackupType } from '../types'

export function BackupTypesSection() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Backup Types</h2>
      <div className="space-y-6">
        {BACKUP_TYPES.map((type) => <BackupTypeCard key={type.name} type={type} />)}
      </div>
    </section>
  )
}

function BackupTypeCard({ type }: { type: BackupType }) {
  const Icon = type.icon
  const colorClasses = BACKUP_COLOR_CLASSES[type.color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-slate-200"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">{type.name}</h3>
          <p className="text-slate-600">{type.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Features</h4>
          <ul className="space-y-1">
            {type.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Use Cases</h4>
          <ul className="space-y-1">
            {type.useCases.map((useCase) => (
              <li key={useCase} className="flex items-start gap-2 text-sm text-slate-600">
                <ArrowLeft className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 rotate-180" />
                {useCase}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
