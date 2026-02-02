/**
 * Database Documentation - Module - Main View Component
 */

'use client'

import { Navigation, Header, ServiceInfo, EndpointsSection, FilterOperators, CodeExamples, SchemaTables, Footer } from './components'

export default function DatabaseDocsView() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <Navigation />

      <main className="mx-auto max-w-[1400px] px-4 py-12">
        <Header />
        <ServiceInfo />
        <EndpointsSection />
        <FilterOperators />
        <CodeExamples />
        <SchemaTables />
        <Footer />
      </main>
    </div>
  )
}
