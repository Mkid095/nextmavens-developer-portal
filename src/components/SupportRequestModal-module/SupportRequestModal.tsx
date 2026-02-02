'use client'

/**
 * Support Request Modal - Main Component
 *
 * @deprecated This file has been refactored into a module structure.
 * Please use './SupportRequestModal-module' instead.
 */

import { AnimatePresence, motion } from 'framer-motion'
import type { SupportRequestModalProps } from './types'
import { useSupportForm } from './hooks/use-support-form'
import { ModalHeader, SuccessState, SupportForm } from './components'

export default function SupportRequestModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: SupportRequestModalProps) {
  const {
    formState,
    handleSubmit,
    handleClose,
    setSubject,
    setDescription,
  } = useSupportForm(isOpen, projectId, projectName, onClose)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <ModalHeader success={formState.success} onClose={handleClose} />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {formState.success ? (
                <SuccessState requestId={formState.requestId} onClose={handleClose} />
              ) : (
                <SupportForm
                  formState={formState}
                  projectName={projectName}
                  onSubmit={handleSubmit}
                  onClose={handleClose}
                  setSubject={setSubject}
                  setDescription={setDescription}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
