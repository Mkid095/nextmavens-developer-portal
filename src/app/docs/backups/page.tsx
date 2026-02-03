'use client'

/**
 * Backups Documentation Page
 */

import {
  Navigation,
  Header,
  BackupTypesSection,
  RetentionPolicySection,
  SecurityFeaturesSection,
  BestPracticesSection,
  ApiAccessSection,
  DocumentationLink,
} from '@/app/docs/backups-module/components'

export default function BackupsDocsView() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <Navigation />

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Header />
        <BackupTypesSection />
        <RetentionPolicySection />
        <SecurityFeaturesSection />
        <BestPracticesSection />
        <ApiAccessSection />
        <DocumentationLink />
      </main>
    </div>
  )
}
