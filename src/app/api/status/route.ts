import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export interface ServiceStatus {
  service: string
  status: 'operational' | 'degraded' | 'outage'
  last_updated: string
  message: string | null
}

export interface IncidentUpdate {
  id: string
  incident_id: string
  message: string
  status: string
  created_at: string
}

export interface Incident {
  id: string
  service: string
  status: string
  title: string
  description: string | null
  impact: string
  started_at: string
  resolved_at: string | null
  affected_services: unknown
  created_at: string
  updates?: IncidentUpdate[]
}

export interface StatusResponse {
  services: ServiceStatus[]
  incidents: Incident[]
  overall_status: 'operational' | 'degraded' | 'outage'
  last_updated: string
}

export async function GET(request: NextRequest) {
  try {
    // Get all service statuses
    const serviceResult = await pool.query(
      `SELECT service, status, last_updated, message
       FROM control_plane.service_status
       ORDER BY service`
    )

    // Get active and recent resolved incidents (last 7 days)
    const incidentBasicResult = await pool.query(
      `SELECT id, service, status, title, description, impact,
              started_at, resolved_at, affected_services, created_at
       FROM control_plane.incidents
       WHERE status = 'active'
          OR (status = 'resolved' AND resolved_at > NOW() - INTERVAL '7 days')
       ORDER BY started_at DESC`
    )

    const services: ServiceStatus[] = serviceResult.rows

    //団地 updates for each incident
    const incidents: Incident[] = []
    for (const incident of incidentBasicResult.rows) {
      const updatesResult = await pool.query(
        `SELECT id, incident_id, message, status, created_at
         FROM control_plane.incident_updates
         WHERE incident_id = $1
         ORDER BY created_at DESC`,
        [incident.id]
      )
      incidents.push({
        ...incident,
        updates: updatesResult.rows,
      })
    }

    // Calculate overall status
    let overall_status: 'operational' | 'degraded' | 'outage' = 'operational'

    for (const service of services) {
      if (service.status === 'outage') {
        overall_status = 'outage'
        break
      } else if (service.status === 'degraded' && overall_status !== 'outage') {
        overall_status = 'degraded'
      }
    }

    const response: StatusResponse = {
      services,
      incidents,
      overall_status,
      last_updated: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
