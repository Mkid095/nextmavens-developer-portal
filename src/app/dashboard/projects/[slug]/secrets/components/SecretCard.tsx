/**
 * Secret Card Component
 */

'use client'

import { motion } from 'framer-motion'
import { Key, Eye, History, RotateCw, Trash2, Calendar, Clock } from 'lucide-react'
import type { Secret } from '@/lib/types/secrets.types'
import { formatDate, formatGracePeriodEnd } from '../utils'

interface SecretCardProps {
  secret: Secret
  onViewDetails: (secret: Secret) => void
  onViewHistory: (secret: Secret) => void
  onRotate: (secret: Secret) => void
  onDelete: (secret: Secret) => void
}

export function SecretCard({ secret, onViewDetails, onViewHistory, onRotate, onDelete }: SecretCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={'p-4 rounded-xl border-2 transition-all hover:shadow-md ' + (secret.active ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={'p-3 rounded-lg ' + (secret.active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-200 dark:bg-slate-700')}>
            <Key className={'w-5 h-5 ' + (secret.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500')} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">{secret.name}</h3>
              {secret.active ? (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">Active</span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">Inactive</span>
              )}
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">v{secret.version}</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Created {formatDate(secret.created_at)}</span>
              </div>

              {secret.rotation_reason && (
                <div className="text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Reason:</span> {secret.rotation_reason}
                </div>
              )}

              {secret.grace_period_ends_at && !secret.active && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  <span>Grace period: {formatGracePeriodEnd(secret.grace_period_ends_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onViewDetails(secret)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group" title="View details">
            <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </button>

          <button onClick={() => onViewHistory(secret)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group" title="View version history">
            <History className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </button>

          {secret.active && (
            <button onClick={() => onRotate(secret)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group" title="Rotate secret">
              <RotateCw className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </button>
          )}

          <button onClick={() => onDelete(secret)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group" title="Delete secret">
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
