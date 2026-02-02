'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useDashboard } from './hooks/useDashboard'
import {
  ToastContainer,
  CreateApiKeyModal,
  SecretKeyModal,
  CreateProjectModal,
  StatsCards,
  ApiKeysList,
  ProjectsList,
  ServicesGrid,
  DashboardNav,
} from './components'

export default function DashboardPage() {
  const {
    developer,
    apiKeys,
    projects,
    deletedProjects,
    loading,
    projectFilter,
    copied,
    toasts,
    showApiKeyModal,
    showProjectModal,
    showSecretModal,
    createdSecretKey,
    createdKeyName,
    apiKeyName,
    projectName,
    keyEnvironment,
    projectEnvironment,
    submitting,
    error,
    setApiKeyName,
    setProjectName,
    setKeyEnvironment,
    setProjectEnvironment,
    setShowSecretModal,
    setProjectFilter,
    handleRestore,
    handleLogout,
    handleCreateApiKey,
    handleCreateProject,
    handleCopy,
    handleCopySecretKey,
    openCreateKeyModal,
    closeCreateKeyModal,
    openCreateProjectModal,
    closeCreateProjectModal,
  } = useDashboard()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Modals */}
      <CreateApiKeyModal
        show={showApiKeyModal}
        apiKeyName={apiKeyName}
        keyEnvironment={keyEnvironment}
        error={error}
        submitting={submitting}
        onClose={closeCreateKeyModal}
        onApiKeyNameChange={setApiKeyName}
        onKeyEnvironmentChange={setKeyEnvironment}
        onSubmit={() => {
          const environmentMap: Record<string, 'prod' | 'dev' | 'staging'> = {
            'live': 'prod',
            'test': 'staging',
            'dev': 'dev',
          }
          handleCreateApiKey({
            name: apiKeyName,
            key_type: 'secret',
            environment: environmentMap[keyEnvironment] || 'dev',
          })
        }}
      />

      <SecretKeyModal
        show={showSecretModal}
        secretKey={createdSecretKey}
        keyName={createdKeyName}
        onClose={() => setShowSecretModal(false)}
        onCopy={handleCopySecretKey}
      />

      <CreateProjectModal
        show={showProjectModal}
        projectName={projectName}
        projectEnvironment={projectEnvironment}
        error={error}
        submitting={submitting}
        onClose={closeCreateProjectModal}
        onProjectNameChange={setProjectName}
        onProjectEnvironmentChange={setProjectEnvironment}
        onSubmit={handleCreateProject}
      />

      {/* Navigation */}
      <DashboardNav developerName={developer?.name} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {developer?.name}</p>
          </div>

          {/* Stats Cards */}
          <StatsCards apiKeysCount={apiKeys.length} projectsCount={projects.length} />

          {/* API Keys and Projects Lists */}
          <div className="grid md:grid-cols-2 gap-8">
            <ApiKeysList
              apiKeys={apiKeys}
              copied={copied}
              onCopy={handleCopy}
              onCreateClick={openCreateKeyModal}
            />
            <ProjectsList
              projects={projects}
              deletedProjects={deletedProjects}
              projectFilter={projectFilter}
              onFilterChange={setProjectFilter}
              onCreateClick={openCreateProjectModal}
              onRestore={handleRestore}
            />
          </div>

          {/* Services Grid */}
          <ServicesGrid />
        </motion.div>
      </main>
    </div>
  )
}
