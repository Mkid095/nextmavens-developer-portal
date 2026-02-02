'use client'

/**
 * Create Secret Modal - Main Component
 *
 * @deprecated This file has been refactored into a module structure.
 * Please use './CreateSecretModal-module' instead.
 *
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Modal for creating new secrets with validation
 */

import { AnimatePresence, motion } from 'framer-motion'
import type { CreateSecretModalProps } from './types'
import { useSecretForm } from './hooks/use-secret-form'
import { ModalHeader, SuccessView, FormView } from './components'

export default function CreateSecretModal({
  isOpen,
  onClose,
  onCreate,
  projectId,
}: CreateSecretModalProps) {
  const {
    formState,
    setName,
    setValue,
    setShowValue,
    handleSubmit,
    handleClose,
    handleCopyValue,
  } = useSecretForm(isOpen, projectId, onCreate, onClose)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md relative"
            >
              <ModalHeader
                createdSecret={formState.createdSecret}
                onClose={handleClose}
                submitting={formState.submitting}
              />

              {/* Content */}
              <div className="p-6">
                {formState.createdSecret ? (
                  <SuccessView
                    createdSecret={formState.createdSecret}
                    showValue={formState.showValue}
                    onToggleShowValue={() => setShowValue(!formState.showValue)}
                    onCopyValue={handleCopyValue}
                    onClose={handleClose}
                  />
                ) : (
                  <FormView
                    formState={formState}
                    onNameChange={setName}
                    onValueChange={setValue}
                    onToggleShowValue={() => setShowValue(!formState.showValue)}
                    onSubmit={handleSubmit}
                    onClose={handleClose}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
