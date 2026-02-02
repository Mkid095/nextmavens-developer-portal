/**
 * Errors Documentation - Main View Component
 */

import { Navigation, Header, ErrorResponseFormat, ErrorCard, SupportSection } from './components'
import { ERROR_DOCS } from './constants'

export function ErrorsPageView() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <Navigation />

      <main className="mx-auto max-w-[1180px] px-4 py-16">
        <Header />
        <ErrorResponseFormat />

        <div className="space-y-6">
          {ERROR_DOCS.map((error) => (
            <ErrorCard key={error.code} error={error} />
          ))}
        </div>

        <SupportSection />
      </main>
    </div>
  )
}
