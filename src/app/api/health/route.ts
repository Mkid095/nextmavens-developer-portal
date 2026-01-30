import { NextRequest, NextResponse } from 'next/server'
import { withCorrelationId, getCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'

export async function GET(req: NextRequest) {
  // Apply correlation ID to request
  const correlationId = withCorrelationId(req)

  const response = NextResponse.json({
    status: 'ok',
    service: 'developer-portal',
    timestamp: new Date().toISOString(),
    correlation_id: correlationId,
  })

  // Set correlation ID header on response
  return setCorrelationHeader(response, correlationId)
}
