/**
 * GET /api/logs/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time log streaming.
 * Streams new logs as they arrive for a specific project.
 *
 * Accepts: project_id (required)
 * Authenticates via Bearer token
 * Sends log entries as JSON SSE messages
 */

import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { getPool } from '@/lib/db'

interface LogEntry {
  id: string
  timestamp: string
  service: 'database' | 'auth' | 'realtime' | 'storage' | 'graphql'
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
  request_id?: string
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SSE stream endpoint for real-time log streaming.
 *
 * Query parameters:
 * - project_id: Required - The project ID to stream logs for
 * - service: Optional - Filter by service (db, auth, realtime, storage, graphql)
 * - level: Optional - Filter by level (info, warn, error)
 * - start_date: Optional - Filter logs after this date (ISO 8601 format)
 * - end_date: Optional - Filter logs before this date (ISO 8601 format)
 */
export async function GET(request: NextRequest) {
  try {
    const developer = await authenticateRequest(request)
    const searchParams = request.nextUrl.searchParams

    const projectId = searchParams.get('project_id')
    const service = searchParams.get('service')
    const level = searchParams.get('level')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify developer owns this project
    const pool = getPool()
    const projectCheck = await pool.query(
      'SELECT id, slug FROM projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let lastTimestamp = new Date().toISOString()
        let pollInterval: NodeJS.Timeout | null = null
        let isClientConnected = true

        const sendSSE = (data: string, event: string = 'message') => {
          if (!isClientConnected) return
          const message = `event: ${event}\ndata: ${data}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        const sendHeartbeat = () => {
          if (!isClientConnected) return
          const comment = ': heartbeat\n\n'
          controller.enqueue(encoder.encode(comment))
        }

        const fetchNewLogs = async () => {
          try {
            let query = `
              SELECT
                id,
                timestamp,
                service,
                level,
                message,
                metadata,
                request_id
              FROM control_plane.project_logs
              WHERE project_id = $1
                AND timestamp > $2
            `
            const params: (string | number)[] = [projectId, lastTimestamp]
            let paramIndex = 3

            if (service) {
              query += ` AND service = $${paramIndex++}`
              params.push(service)
            }

            if (level) {
              query += ` AND level = $${paramIndex++}`
              params.push(level)
            }

            if (startDate) {
              query += ` AND timestamp >= $${paramIndex++}`
              params.push(startDate)
            }

            if (endDate) {
              query += ` AND timestamp <= $${paramIndex++}`
              params.push(endDate)
            }

            query += ` ORDER BY timestamp ASC`

            const result = await pool.query(query, params)

            for (const row of result.rows) {
              const logEntry: LogEntry = {
                id: row.id,
                timestamp: row.timestamp,
                service: row.service,
                level: row.level,
                message: row.message,
                metadata: row.metadata ? JSON.parse(JSON.stringify(row.metadata)) : undefined,
                request_id: row.request_id,
              }

              sendSSE(JSON.stringify(logEntry), 'log')

              // Update last timestamp
              if (row.timestamp > lastTimestamp) {
                lastTimestamp = row.timestamp
              }
            }
          } catch (error) {
            console.error('[Logs Stream] Error fetching logs:', error)
            sendSSE(
              JSON.stringify({ error: 'Failed to fetch logs' }),
              'error'
            )
          }
        }

        // Send initial connection message
        sendSSE(
          JSON.stringify({
            connected: true,
            project_id: projectId,
            timestamp: new Date().toISOString(),
          }),
          'connected'
        )

        // Poll for new logs every 2 seconds
        pollInterval = setInterval(() => {
          if (isClientConnected) {
            fetchNewLogs()
            sendHeartbeat() // Send heartbeat to keep connection alive
          }
        }, 2000)

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          isClientConnected = false
          if (pollInterval) {
            clearInterval(pollInterval)
          }
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Logs Stream] Error:', error)
    return new Response(
      JSON.stringify({
        error: err.message === 'No token provided'
          ? 'Authentication required'
          : 'Failed to establish log stream'
      }),
      {
        status: err.message === 'No token provided' ? 401 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
