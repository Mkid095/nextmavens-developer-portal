import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import { withCorrelationId, setCorrelationHeader } from '@/lib/middleware/correlation'
import { getPool } from '@/lib/db'

/**
 * GET /api/projects/[projectId]/deletion-preview
 * Get deletion preview for a project
 *
 * Returns:
 * - Project details
 * - will_be_deleted counts: schemas, tables, api_keys, webhooks, edge_functions, storage_buckets, secrets
 * - dependencies array: type, target, impact
 * - recoverable_until date
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const correlationId = withCorrelationId(req)

  try {
    await authenticateRequest(req)
    const projectId = params.projectId
    const pool = getPool()

    // Get project details
    const projectResult = await pool.query(
      `SELECT id, name, slug, tenant_id, status, deletion_scheduled_at, grace_period_ends_at, created_at
       FROM control_plane.projects
       WHERE id = $1`,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = projectResult.rows[0]

    // Count API keys for this project
    const apiKeysResult = await pool.query(
      `SELECT COUNT(*) as count FROM api_keys WHERE project_id = $1`,
      [projectId]
    )

    // Count webhooks for this project
    const webhooksResult = await pool.query(
      `SELECT COUNT(*) as count FROM control_plane.webhooks WHERE project_id = $1`,
      [projectId]
    )

    // Get webhook URLs for dependencies
    const webhookUrlsResult = await pool.query(
      `SELECT event, target_url FROM control_plane.webhooks WHERE project_id = $1`,
      [projectId]
    )

    // Count edge functions for this project
    const edgeFunctionsResult = await pool.query(
      `SELECT COUNT(*) as count FROM control_plane.edge_functions WHERE project_id = $1`,
      [projectId]
    )

    // Count storage buckets for this project
    const storageBucketsResult = await pool.query(
      `SELECT COUNT(*) as count FROM control_plane.storage_buckets WHERE project_id = $1`,
      [projectId]
    )

    // Get storage buckets for dependencies
    const storageBucketsListResult = await pool.query(
      `SELECT name, file_count FROM control_plane.storage_buckets WHERE project_id = $1`,
      [projectId]
    )

    // Count secrets for this project
    const secretsResult = await pool.query(
      `SELECT COUNT(*) as count FROM control_plane.secrets WHERE project_id = $1`,
      [projectId]
    )

    // Count schemas and tables for tenant schema
    const tenantSchema = `tenant_${project.slug}`
    let schemaCount = 0
    let tableCount = 0

    try {
      // Count tables in the tenant schema
      const tablesResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM information_schema.tables
         WHERE table_schema = $1
         AND table_type = 'BASE TABLE'`,
        [tenantSchema]
      )
      tableCount = parseInt(tablesResult.rows[0]?.count || '0', 10)

      // Each tenant has one schema
      schemaCount = tableCount > 0 ? 1 : 0
    } catch (error) {
      // Schema might not exist yet
      console.warn('[Deletion Preview] Tenant schema not found:', tenantSchema)
    }

    // Calculate recoverable_until date
    let recoverableUntil: string | null = null
    if (project.grace_period_ends_at) {
      recoverableUntil = project.grace_period_ends_at.toISOString()
    } else if (project.deletion_scheduled_at) {
      // Default to 30 days from deletion_scheduled_at
      const gracePeriodEnd = new Date(project.deletion_scheduled_at)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30)
      recoverableUntil = gracePeriodEnd.toISOString()
    }

    // Build dependencies array
    const dependencies: Array<{
      type: string
      target: string
      impact: string
    }> = []

    // Add webhook dependencies
    for (const webhook of webhookUrlsResult.rows) {
      dependencies.push({
        type: 'webhook',
        target: webhook.target_url,
        impact: `Will stop receiving ${webhook.event} events`,
      })
    }

    // Add storage bucket dependencies
    for (const bucket of storageBucketsListResult.rows) {
      const fileCount = bucket.file_count || 0
      dependencies.push({
        type: 'storage',
        target: bucket.name,
        impact: `All ${fileCount} files in this bucket will be permanently deleted`,
      })
    }

    // Build response
    const response = {
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        status: project.status,
        created_at: project.created_at,
      },
      will_be_deleted: {
        schemas: schemaCount,
        tables: tableCount,
        api_keys: parseInt(apiKeysResult.rows[0]?.count || '0', 10),
        webhooks: parseInt(webhooksResult.rows[0]?.count || '0', 10),
        edge_functions: parseInt(edgeFunctionsResult.rows[0]?.count || '0', 10),
        storage_buckets: parseInt(storageBucketsResult.rows[0]?.count || '0', 10),
        secrets: parseInt(secretsResult.rows[0]?.count || '0', 10),
      },
      dependencies,
      recoverable_until: recoverableUntil,
    }

    const res = NextResponse.json(response)
    return setCorrelationHeader(res, correlationId)
  } catch (error: any) {
    console.error('[Deletion Preview API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get deletion preview' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}
