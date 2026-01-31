'use client'

import {
  PlatformPhilosophyHeader,
  CorePrinciples,
  PlatformPhilosophyNavigation,
} from '@/components/docs/platform-philosophy'

export default function PlatformPhilosophyPage() {
  return (
    <>
      <PlatformPhilosophyHeader />
      <div className="mx-auto max-w-[1180px] px-4">
        <CorePrinciples />
        <PlatformPhilosophyNavigation />
      </div>
    </>
  )
}
