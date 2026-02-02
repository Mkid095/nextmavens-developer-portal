/**
 * Invite Member Modal Component
 * Modal for inviting new team members
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Loader2 } from 'lucide-react'
import { ROLE_DESCRIPTIONS } from '../constants'
import type { Role } from '../types'

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onEmailChange: (email: string) => void
  role: Role
  onRoleChange: (role: Role) => void
  isSubmitting: boolean
  canManageUsers: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function InviteMemberModal({
  isOpen,
  onClose,
  email,
  onEmailChange,
  role,
  onRoleChange,
  isSubmitting,
  canManageUsers,
  onSubmit,
}: InviteMemberModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
              <h2 className="text-xl font-semibold text-slate-900">Invite Team Member</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => onRoleChange(e.target.value as Role)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent bg-white"
                  >
                    {canManageUsers ? (
                      <>
                        <option value="admin">Admin - Can manage projects, services, and API keys</option>
                        <option value="developer">Developer - Can view logs and use services</option>
                        <option value="viewer">Viewer - Read-only access</option>
                      </>
                    ) : (
                      <>
                        <option value="developer">Developer - Can view logs and use services</option>
                        <option value="viewer">Viewer - Read-only access</option>
                      </>
                    )}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
