import { NextResponse } from 'next/server'

// Version information interface
interface ApiVersion {
  version: string
  path: string
  status: 'current' | 'deprecated' | 'sunset'
  deprecation_date?: string
  sunset_date?: string
  supported_until?: string
}

// GET /versions - Returns available API versions
// US-006: Document Version Discovery
export async function GET() {
  const versions: ApiVersion[] = [
    {
      version: 'v1',
      path: '/api/v1',
      status: 'current',
    },
  ]

  return NextResponse.json({
    versions,
    current: 'v1',
    meta: {
      documentation_url: '/docs/api-versioning',
      deprecation_policy: {
        notice_period_months: 6,
        support_period_months: 12,
      },
    },
  })
}
