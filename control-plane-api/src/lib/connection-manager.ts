/**
 * Connection Manager for Control Plane API
 * Centralized database connection management
 */

import { Pool, PoolClient, QueryResult } from 'pg'

let pool: Pool | null = null

/**
 * Initialize the database connection pool
 */
export function initializeConnectionManager(): void {
  if (pool) {
    return
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: process.env.PGPOOL_MAX ? parseInt(process.env.PGPOOL_MAX) : 20,
    idleTimeoutMillis: process.env.PGIDLE_TIMEOUT_MS ? parseInt(process.env.PGIDLE_TIMEOUT_MS) : 30000,
    connectionTimeoutMillis: process.env.PGCONNECTION_TIMEOUT_MS ? parseInt(process.env.PGCONNECTION_TIMEOUT_MS) : 10000,
  })

  console.log('[Control Plane API] Database connection pool initialized')
}

/**
 * Get the connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    initializeConnectionManager()
  }
  return pool!
}

/**
 * Execute a query directly
 */
export async function query<T extends Record<string, any> = any>(
  sql: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const actualPool = getPool()
  const start = Date.now()
  const result = await actualPool.query<T>(sql, params)
  const duration = Date.now() - start

  // Log slow queries
  if (duration > 1000) {
    console.warn(`[Control Plane API] Slow query (${duration}ms):`, sql)
  }

  return result
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const actualPool = getPool()
  const client = await actualPool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Connection manager object for repository use
 */
export const connectionManager = {
  async query<T extends Record<string, any> = any>(sql: string, params: any[] = []): Promise<{ data: T[]; rowCount: number | null }> {
    const result = await query<T>(sql, params)
    return {
      data: result.rows,
      rowCount: result.rowCount,
    }
  },

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return transaction(callback)
  },

  async getHealthStatus() {
    try {
      const start = Date.now()
      const actualPool = getPool()
      const client = await actualPool.connect()
      await client.query('SELECT 1')
      const latency = Date.now() - start
      client.release()

      return {
        healthy: true,
        latency,
        connectionCount: actualPool.totalCount,
        idleCount: actualPool.idleCount,
      }
    } catch (error) {
      return {
        healthy: false,
        latency: null,
        connectionCount: pool?.totalCount || 0,
        idleCount: pool?.idleCount || 0,
        error: (error as Error).message,
      }
    }
  },
}
