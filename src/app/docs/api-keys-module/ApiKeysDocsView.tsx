/**
 * API Keys Documentation - Main View Component
 */

'use client'

import { Navigation, Header, OverviewSection, KeyTypeCard, EnvironmentPrefixes, ExampleKeyFormat, BestPractices, Footer } from './components'
import { KEY_TYPES } from './constants'

export function ApiKeysDocsView() {
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
        <OverviewSection />

        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Key Types</h2>
        <div className="space-y-8 mb-12">
          {KEY_TYPES.map((keyType, index) => (
            <KeyTypeCard key={keyType.id} keyType={keyType} index={index} />
          ))}
        </div>

        <EnvironmentPrefixes />
        <ExampleKeyFormat />
        <BestPractices />
        <Footer />
      </main>
    </div>
  )
}
