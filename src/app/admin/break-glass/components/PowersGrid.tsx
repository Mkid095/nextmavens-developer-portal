/**
 * Powers Grid Component
 * Displays available administrative powers
 */

import { motion } from 'framer-motion'
import type { Power } from '../types'
import { POWERS } from '../constants'

interface PowersGridProps {
  authenticated: boolean
  onPowerClick: (power: Power) => void
}

export function PowersGrid({ authenticated, onPowerClick }: PowersGridProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        {authenticated ? 'Available Powers' : 'Available Powers (Authentication Required)'}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {POWERS.map((power) => {
          const Icon = power.icon
          const isDisabled = !authenticated

          return (
            <motion.button
              key={power.id}
              whileHover={isDisabled ? {} : { scale: 1.02 }}
              whileTap={isDisabled ? {} : { scale: 0.98 }}
              onClick={() => !isDisabled && onPowerClick(power)}
              disabled={isDisabled}
              className={`p-6 rounded-xl border-2 text-left transition ${
                isDisabled
                  ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : `border-${power.color}-200 bg-white hover:border-${power.color}-300 hover:shadow-md cursor-pointer`
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 bg-${power.color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${power.color}-700`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{power.name}</h3>
                  <p className="text-sm text-slate-600">{power.description}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-200 rounded font-mono">{power.method}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono">{power.endpoint}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
