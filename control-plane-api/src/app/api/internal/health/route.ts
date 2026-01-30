import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { addApiVersionHeaders } from '@/lib/api-versioning'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const uptime = process.uptime()

  // Check database connection
  let dbStatus = 'unknown'
  let dbLatency = 0
  try {
    const pool = getPool()
    const client = await pool.connect()
    const dbStart = Date.now()
    await client.query('SELECT 1')
    dbLatency = Date.now() - dbStart
    client.release()
    dbStatus = 'healthy'
  } catch (error) {
    dbStatus = 'unhealthy'
    console.error('Database health check failed:', error)
  }

  const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'unhealthy'
  const statusCode = overallStatus === 'healthy' ? 200 : 503

  const response = NextResponse.json(
    {
      status: overallStatus,
      version: '1.0.0',
      uptime: Math.floor(uptime),
      dependencies: {
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
      },
    },
    { status: statusCode }
  )

  // Add API versioning headers
  return addApiVersionHeaders(response)
}
