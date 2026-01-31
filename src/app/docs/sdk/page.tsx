'use client'

import {
  SdkHeader,
  SdkInstall,
  SdkInitialization,
  SdkDatabase,
  SdkAuth,
  SdkRealtime,
  SdkResources,
  SdkNavigation,
} from '@/components/docs/sdk'

export default function SdkDocsPage() {
  return (
    <>
      <SdkHeader />
      <div className="mx-auto max-w-[1400px] px-4 pb-12">
        <SdkInstall />
        <SdkInitialization />
        <SdkDatabase />
        <SdkAuth />
        <SdkRealtime />
        <SdkResources />
        <SdkNavigation />
      </div>
    </>
  )
}
