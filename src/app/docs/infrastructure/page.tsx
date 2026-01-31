'use client'

import {
  InfrastructureHeader,
  TableOfContents,
  CurrentDeployment,
  ArchitectureDiagram,
  ServiceComponents,
  ServiceDependencies,
  ScalingRoadmap,
  SLA,
  InfrastructureNavigation,
} from '@/components/docs/infrastructure'

export default function InfrastructureDocsPage() {
  return (
    <>
      <InfrastructureHeader />
      <div className="mx-auto max-w-[1180px] px-4 pb-16">
        <TableOfContents />
        <CurrentDeployment />
        <ArchitectureDiagram />
        <ServiceComponents />
        <ServiceDependencies />
        <ScalingRoadmap />
        <SLA />
        <InfrastructureNavigation />
      </div>
    </>
  )
}
