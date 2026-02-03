'use client'

/**
 * Authentication Documentation Page
 */

import { Navigation, Header, ServiceInfo, EndpointsList, JwtStructure, SecurityPractices, Footer } from '@/app/docs/auth-module/components'

export default function AuthDocsView() {
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
        <EndpointsList />
        <JwtStructure />
        <SecurityPractices />
        <Footer />
      </main>
    </div>
  )
}
