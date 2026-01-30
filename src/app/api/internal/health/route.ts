import { NextRequest, NextResponse } from 'next/server'
import { withCorrelationId, getCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { getPool } from '@/lib/db'
import packageJson from '../../../../../package.json'

interface DependencyHealth {
  status: 'healthy' | 'unhealthy' | 'unknown'
  latency_ms?: number
  error?: string
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'unknown'
  version: string
  uptime: number
  dependencies: {
    database: DependencyHealth
    redis?: DependencyHealth
  }
}

/**
 * GET /internal/health
 *
 * Service health endpoint that checks:
 * - Overall service status
 * - Service version
 * - Service uptime
 * - Database connectivity and latency
 * - Redis connectivity and latency (if configured)
 *
 * Returns 200 if all dependencies are healthy
 * Returns 503 if any dependency is unhealthy
 */
export async function GET(req: NextRequest) {
  const correlationId = withCorrelationId(req)
  const startTime = Date.now()
  const uptime = process.uptime()

  // Check database connection
  const dbHealth = await checkDatabaseHealth()

  // Check Redis connection (if configured)
  const redisHealth = await checkRedisHealth()

  // Determine overall status
  const dependencies: HealthResponse['dependencies'] = {
    database: dbHealth,
  }

  if (redisHealth) {
    dependencies.redis = redisHealth
  }

  const overallStatus = determineOverallStatus(dependencies)
  const statusCode = overallStatus === 'healthy' ? 200 : 503

  const response = NextResponse.json(
    {
      status: overallStatus,
      version: packageJson.version,
      uptime: Math.floor(uptime),
      dependencies,
    } as HealthResponse,
    { status: statusCode }
  )

  return setCorrelationHeader(response, correlationId)
}

/**
 * Check database health by executing a simple query
 */
async function checkDatabaseHealth(): Promise<DependencyHealth> {
  const startTime = Date.now()

  try {
    const pool = getPool()
    const client = await pool.connect()
    await client.query('SELECT 1')
    const latency = Date.now() - startTime
    client.release()

    return {
      status: 'healthy',
      latency_ms: latency,
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check Redis health (if REDIS_URL is configured)
 * Note: This implementation uses a simple TCP connection check
 * since Redis client may not be installed in all environments
 */
async function checkRedisHealth(): Promise<DependencyHealth | null> {
  const redisUrl = process.env.REDIS_URL

  // Skip Redis check if not configured
  if (!redisUrl) {
    return null
  }

  const startTime = Date.now()

  try {
    // Parse Redis URL to get host and port
    const url = new URL(redisUrl)
    const host = url.hostname
    const port = parseInt(url.port) || 6379

    // Simple TCP connection check
    const net = await import('net')
    const result = await testTcpConnection(host, port)
    const latency = Date.now() - startTime

    return result
      ? {
          status: 'healthy',
          latency_ms: latency,
        }
      : {
          status: 'unhealthy',
          error: 'Connection refused',
        }
  } catch (error) {
    console.error('Redis health check failed:', error)
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test TCP connection to a host:port
 */
function testTcpConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net')
    const socket = new net.Socket()

    socket.setTimeout(2000) // 2 second timeout

    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })

    socket.on('error', () => {
      socket.destroy()
      resolve(false)
    })

    socket.connect(port, host)
  })
}

/**
 * Determine overall health status based on dependencies
 */
function determineOverallStatus(
  dependencies: HealthResponse['dependencies']
): 'healthy' | 'unhealthy' | 'unknown' {
  const deps = Object.values(dependencies)

  // If any dependency is unhealthy, overall is unhealthy
  if (deps.some((dep) => dep.status === 'unhealthy')) {
    return 'unhealthy'
  }

  // If all dependencies are healthy, overall is healthy
  if (deps.every((dep) => dep.status === 'healthy')) {
    return 'healthy'
  }

  // Otherwise unknown
  return 'unknown'
}
