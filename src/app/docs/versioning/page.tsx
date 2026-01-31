'use client'

import {
  VersioningHeader,
  ApiVersioning,
  SdkSemanticVersioning,
  DeprecationTimeline,
  BreakingChanges,
  VersionDiscovery,
  VersionHeaders,
  VersioningNavigation,
} from '@/components/docs/versioning'

export default function VersioningPage() {
  return (
    <>
      <VersioningHeader />
      <div className="mx-auto max-w-[1180px] px-4 pb-12">
        <ApiVersioning />
        <SdkSemanticVersioning />
        <DeprecationTimeline />
        <BreakingChanges />
        <VersionDiscovery />
        <VersionHeaders />
        <VersioningNavigation />
      </div>
    </>
  )
}
