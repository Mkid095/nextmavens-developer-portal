/**
 * Changelog - Main View Component
 */

'use client'

import { useState } from 'react'
import { Navigation, Header, AboutSection, ChangelogEntryCard, Footer } from './components'
import { CHANGELOG_DATA } from './constants'
import { generateRSS, downloadRSS } from './utils'

export function ChangelogPageView() {
  const [copied, setCopied] = useState<string | null>(null)

  const handleDownloadRSS = () => {
    const rss = generateRSS(CHANGELOG_DATA)
    downloadRSS(rss)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <Navigation />

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Header onDownloadRSS={handleDownloadRSS} />
        <AboutSection />

        <div className="space-y-6">
          {CHANGELOG_DATA.map((entry, index) => (
            <ChangelogEntryCard key={entry.version} entry={entry} index={index} />
          ))}
        </div>

        <Footer />
      </main>
    </div>
  )
}
