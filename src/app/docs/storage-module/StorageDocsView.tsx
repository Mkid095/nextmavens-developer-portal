/**
 * Storage Documentation - Main View Component
 */

'use client'

import { Navigation, Header, ServiceInfo, EndpointCard, CodeExamples, SupportedFormats, Footer } from './components'
import { ENDPOINTS } from './constants'

export function StorageDocsView() {
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

        <h2 className="text-2xl font-semibold text-slate-900 mb-6">API Endpoints</h2>
        <div className="space-y-6 mb-12">
          {ENDPOINTS.map((endpoint) => (
            <EndpointCard key={endpoint.name} endpoint={endpoint} />
          ))}
        </div>

        <CodeExamples />
        <SupportedFormats />
        <Footer />
      </main>
    </div>
  )
}
