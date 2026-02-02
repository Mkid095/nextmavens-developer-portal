'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Info, AlertCircle } from 'lucide-react'
import { useFeatureFlags } from './hooks/useFeatureFlags'
import { useToasts } from './hooks/useToasts'
import {
  ToastNotifications,
  PageHeader,
  CreateFlagModal,
  FlagList,
} from './components'

export default function ProjectFeatureFlagsPage() {
  const params = useParams()
  const slug = params.slug as string

  const [showCreateModal, setShowCreateModal] = useState(false)

  // Hooks
  const {
    loading,
    projectFlags,
    globalFlags,
    updating,
    deleting,
    error,
    fetching,
    toggleFlag,
    deleteFlag,
    createFlag,
    refreshFlags,
  } = useFeatureFlags(slug)

  const { toasts, addToast } = useToasts()

  // Handlers
  const handleToggleFlag = async (flag: any) => {
    const success = await toggleFlag(flag)
    if (success) {
      addToast('success', `${flag.name} ${!flag.enabled ? 'enabled' : 'disabled'} successfully`)
    } else {
      addToast('error', `Failed to ${flag.enabled ? 'disable' : 'enable'} ${flag.name}`)
    }
  }

  const handleDeleteFlag = async (flag: any) => {
    if (flag.scope !== 'project') {
      addToast('error', 'Can only delete project-specific flags')
      return
    }

    if (
      !confirm(
        `Are you sure you want to delete the project-specific override for "${flag.name}"? This will revert to the global flag value.`
      )
    ) {
      return
    }

    const success = await deleteFlag(flag)
    if (success) {
      addToast('success', `Project-specific flag "${flag.name}" removed`)
    } else {
      addToast('error', `Failed to remove ${flag.name}`)
    }
  }

  const handleCreateFlag = async (name: string, enabled: boolean) => {
    const success = await createFlag(name, enabled)
    if (success) {
      addToast('success', `Project flag "${name}" created successfully`)
      setShowCreateModal(false)
    } else {
      addToast('error', `Failed to create flag "${name}"`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <ToastNotifications toasts={toasts} />
      <PageHeader projectSlug={slug} onAddFlag={() => setShowCreateModal(true)} />

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Project-Level Flags:</strong> Project-specific flags override global
                flags for this project only. Create a project-specific flag to customize behavior
                for this project without affecting other projects.
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Project-Specific Flags */}
          <FlagList
            title="Project-Specific Flags"
            flags={projectFlags}
            updating={updating}
            deleting={deleting}
            onToggle={handleToggleFlag}
            onDelete={handleDeleteFlag}
            onRefresh={refreshFlags}
            fetching={fetching}
            showDelete={true}
            emptyMessage="No project-specific flags"
            emptySubtext="Create a project-specific flag to override global defaults"
          />

          {/* Global Flags (Reference) */}
          <FlagList
            title="Global Flags (Reference)"
            flags={globalFlags}
            updating={updating}
            deleting={deleting}
            onToggle={handleToggleFlag}
            onDelete={handleDeleteFlag}
            showDelete={false}
            emptyMessage="No global flags"
            isReference={true}
          />
        </motion.div>
      </main>

      <CreateFlagModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateFlag}
        existingFlags={[...projectFlags, ...globalFlags]}
      />
    </div>
  )
}
