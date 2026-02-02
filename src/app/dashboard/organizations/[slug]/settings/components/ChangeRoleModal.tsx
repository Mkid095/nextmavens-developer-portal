/**
 * Change Role Modal Component
 * Modal for changing team member roles
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Loader2, Check } from 'lucide-react'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../constants'
import { getRoleBadgeColor } from '../utils'
import type { Role, MemberToChangeRole } from '../types'

interface ChangeRoleModalProps {
  member: MemberToChangeRole | null
  onClose: () => void
  newRole: Role
  onRoleChange: (role: Role) => void
  isSubmitting: boolean
  onSubmit: () => void
}

export function ChangeRoleModal({
  member,
  onClose,
  newRole,
  onRoleChange,
  isSubmitting,
  onSubmit,
}: ChangeRoleModalProps) {
  if (!member) return null

  return (
    <AnimatePresence>
      {member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Change Role</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <p className="text-slate-600 mb-4">
              Change <span className="font-medium text-slate-900">{member.name}</span>'s role
            </p>

            <div className="space-y-2 mb-6">
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([role, label]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleChange(role)}
                  className={`w-full p-3 rounded-lg border text-left transition ${
                    newRole === role
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(role)}`}>
                          {label}
                        </span>
                        {newRole === role && (
                          <Check className="w-4 h-4 text-emerald-700" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{ROLE_DESCRIPTIONS[role]}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || newRole === member.currentRole}
                className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Change Role
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
